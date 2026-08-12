"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useRealtimeRefresh } from "@/hooks/useRealtimeRefresh";
import { InstallPrompt } from "@/components/InstallPrompt";
import { useTheme } from "@/components/ThemeProvider";
import {
  DashboardIcon, InventoryIcon, BillingIcon, CustomersIcon, EnquiriesIcon,
  QuotationsIcon, InvoicesIcon, SuppliersIcon, ExpensesIcon, CashbookIcon,
  ReportIcon, InstallationsIcon, AmcIcon, EmployeesIcon, UsersIcon, SettingsIcon,
  LogoutIcon, MenuIcon, SunIcon, MoonIcon
} from "@/components/Icons";

type NavItem = {
  href?: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  type?: "group" | "item";
  badgeKey?: "lowStock" | "amcExpiring";
};

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: DashboardIcon },
  { href: "/inventory", label: "Inventory", icon: InventoryIcon, badgeKey: "lowStock" },
  { type: "group", label: "Sales" },
  { href: "/billing", label: "Billing", icon: BillingIcon },
  { href: "/customers", label: "Customers", icon: CustomersIcon },
  { href: "/enquiries", label: "Enquiries", icon: EnquiriesIcon },
  { href: "/quotations", label: "Quotations", icon: QuotationsIcon },
  { href: "/invoices", label: "Invoices", icon: InvoicesIcon },
  { type: "group", label: "Procurement" },
  { href: "/suppliers", label: "Suppliers & PO", icon: SuppliersIcon },
  { type: "group", label: "Finance" },
  { href: "/expenses", label: "Expenses", icon: ExpensesIcon },
  { href: "/cashbook", label: "Cash Book", icon: CashbookIcon },
  { href: "/reports/gst", label: "GST Report", icon: ReportIcon },
  { type: "group", label: "Operations" },
  { href: "/installations", label: "Installations", icon: InstallationsIcon },
  { href: "/amc", label: "AMC & Warranty", icon: AmcIcon, badgeKey: "amcExpiring" },
  { type: "group", label: "People" },
  { href: "/employees", label: "Employees", icon: EmployeesIcon },
  { href: "/users", label: "Users", icon: UsersIcon },
  { type: "group", label: "System" },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [badges, setBadges] = useState<{ lowStock?: number; amcExpiring?: number }>({});

  // Subscribe to realtime DB changes — any insert/update/delete on any
  // table triggers a debounced router.refresh() so lists + KPIs update
  // instantly without manual page reload.
  useRealtimeRefresh();

  // Fetch badges on mount + every 60s
  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const res = await fetch("/api/badges");
        if (res.ok) setBadges(await res.json());
      } catch {
        // ignore
      }
    };
    fetchBadges();
    const t = setInterval(fetchBadges, 60_000);
    return () => clearInterval(t);
  }, []);

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <div className="flex h-screen bg-[#faf6f0] w-full overflow-hidden">
      {/* Sidebar — h-screen so it stays pinned. Nav scrolls internally. */}
      <aside
        className={`w-60 bg-[#f5efe5] border-r border-[#e6e0d4] flex flex-col shrink-0 h-screen
          max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:z-50 max-lg:transition-transform max-lg:shadow-2xl
          ${mobileOpen ? "max-lg:translate-x-0" : "max-lg:-translate-x-full"}`}
      >
        <div className="p-5 border-b border-[#e6e0d4]">
          <img src="/logo.jpeg" alt="KARSHANI ENTERPRISES" className="w-10 h-10 rounded-full object-cover border-2 border-amber-200 flex-shrink-0" />
          <h2 className="font-serif text-lg text-[#1c1915] leading-tight">KARSHANI<br />ENTERPRISES</h2>
          <span className="text-[10px] text-[#787468] uppercase tracking-wider">Solar CMS</span>
        </div>
        <nav className="flex-1 p-2 flex flex-col gap-px overflow-y-auto">
          {NAV_ITEMS.map((item, i) =>
            item.type === "group" ? (
              <div key={i} className="text-[10px] text-[#787468] uppercase tracking-widest font-semibold px-3 pt-4 pb-1">
                {item.label}
              </div>
            ) : (
              <Link
                key={item.href}
                href={item.href || "/"}
                onClick={() => {
                  setMobileOpen(false);
                  // Bust the Router Cache so the destination page fetches
                  // fresh data instead of showing a stale cached version.
                  router.refresh();
                }}
                prefetch
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  pathname === item.href
                    ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 shadow-sm"
                    : "text-[#504d44] dark:text-[#a8a29e] hover:bg-[#faf6f0] dark:hover:bg-[#2a2620] hover:text-[#1c1915] dark:hover:text-[#f5efe5]"
                }`}
              >
                {item.icon && <item.icon className="w-4 h-4 shrink-0" />}
                <span className="flex-1">{item.label}</span>
                {item.badgeKey && badges[item.badgeKey] ? (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      item.badgeKey === "lowStock"
                        ? "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400"
                        : "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400"
                    }`}
                  >
                    {badges[item.badgeKey]}
                  </span>
                ) : null}
              </Link>
            )
          )}
        </nav>
        <div className="p-3 border-t border-[#e6e0d4] dark:border-[#2e2a25]">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 text-xs text-[#787468] dark:text-[#a8a29e] hover:text-red-600 dark:hover:text-red-400 w-full text-left py-2 px-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          >
            <LogoutIcon className="w-4 h-4 shrink-0" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/30 z-40" onClick={() => setMobileOpen(false)} />
      )}

      {/* Main — bounded height (h-screen via parent), main scrolls internally */}
      <div className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
        <InstallPrompt />
        <header className="shrink-0 sticky top-0 z-10 bg-[#faf6f0]/95 dark:bg-[#0c0a09]/95 backdrop-blur-sm border-b border-[#e6e0d4] dark:border-[#2e2a25] px-8 py-3 flex items-center justify-between gap-4 max-lg:px-4">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg border border-[#e6e0d4] dark:border-[#2e2a25] bg-white dark:bg-[#1c1917] text-[#504d44] dark:text-[#a8a29e] hover:bg-[#faf6f0] dark:hover:bg-[#2a2620]"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <MenuIcon className="w-5 h-5" />
            </button>
            <h1 className="font-serif text-xl text-[#1c1915] dark:text-[#f5efe5] tracking-tight">
              {NAV_ITEMS.find((i) => i.href === pathname)?.label || "Dashboard"}
            </h1>
          </div>
          <button
            onClick={toggleTheme}
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#e6e0d4] dark:border-[#2e2a25] bg-white dark:bg-[#1c1917] text-[#504d44] dark:text-[#a8a29e] hover:bg-[#faf6f0] dark:hover:bg-[#2a2620] hover:border-amber-400 dark:hover:border-amber-600"
            aria-label="Toggle dark mode"
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <SunIcon className="w-4 h-4" /> : <MoonIcon className="w-4 h-4" />}
          </button>
        </header>
        <main className="p-8 max-lg:p-4 flex-1 overflow-y-auto overscroll-contain">{children}</main>
      </div>
    </div>
  );
}

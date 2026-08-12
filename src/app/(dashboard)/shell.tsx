"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useRealtimeRefresh } from "@/hooks/useRealtimeRefresh";
import { InstallPrompt } from "@/components/InstallPrompt";
import { useTheme } from "@/components/ThemeProvider";

type NavItem = {
  href?: string;
  label: string;
  icon?: string;
  type?: "group" | "item";
  badgeKey?: "lowStock" | "amcExpiring";
};

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: "◐" },
  { href: "/inventory", label: "Inventory", icon: "⊞", badgeKey: "lowStock" },
  { type: "group", label: "Sales" },
  { href: "/billing", label: "Billing", icon: "₹" },
  { href: "/customers", label: "Customers", icon: "👥" },
  { href: "/enquiries", label: "Enquiries", icon: "💬" },
  { href: "/quotations", label: "Quotations", icon: "📄" },
  { href: "/invoices", label: "Invoices", icon: "📋" },
  { type: "group", label: "Procurement" },
  { href: "/suppliers", label: "Suppliers & PO", icon: "📦" },
  { type: "group", label: "Finance" },
  { href: "/expenses", label: "Expenses", icon: "💰" },
  { href: "/cashbook", label: "Cash Book", icon: "📒" },
  { href: "/reports/gst", label: "GST Report", icon: "📊" },
  { type: "group", label: "Operations" },
  { href: "/installations", label: "Installations", icon: "⚡" },
  { href: "/amc", label: "AMC & Warranty", icon: "🛡️", badgeKey: "amcExpiring" },
  { type: "group", label: "People" },
  { href: "/employees", label: "Employees", icon: "🧑‍💼" },
  { href: "/users", label: "Users", icon: "🔑" },
  { type: "group", label: "System" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
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
    <div className="flex min-h-screen bg-[#faf6f0] w-full overflow-x-hidden">
      {/* Sidebar — sticky + h-screen so it stays in place while main
          content scrolls. The nav inside scrolls independently. */}
      <aside
        className={`w-60 bg-[#f5efe5] border-r border-[#e6e0d4] flex flex-col shrink-0
          sticky top-0 h-screen
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
                onClick={() => setMobileOpen(false)}
                prefetch
                className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === item.href
                    ? "bg-amber-50 text-amber-700"
                    : "text-[#504d44] hover:bg-[#faf6f0] hover:text-[#1c1915]"
                }`}
              >
                <span className="w-4 text-center text-xs">{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                {item.badgeKey && badges[item.badgeKey] ? (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      item.badgeKey === "lowStock"
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {badges[item.badgeKey]}
                  </span>
                ) : null}
              </Link>
            )
          )}
        </nav>
        <div className="p-3 border-t border-[#e6e0d4]">
          <button
            onClick={handleLogout}
            className="text-xs text-[#787468] hover:text-red-600 w-full text-left py-1"
          >
            ⏻ Logout
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/30 z-40" onClick={() => setMobileOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        <InstallPrompt />
        <header className="sticky top-0 z-10 bg-[#faf6f0] dark:bg-[#0f0e0c] border-b border-[#e6e0d4] dark:border-[#2e2a25] px-8 py-4 flex items-center justify-between gap-4 max-lg:px-4">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden w-8 h-8 flex items-center justify-center rounded border border-[#e6e0d4] dark:border-[#2e2a25] bg-white dark:bg-[#1a1815] text-lg"
              onClick={() => setMobileOpen(true)}
            >
              ☰
            </button>
            <h1 className="font-serif text-xl text-[#1c1915] dark:text-[#f5efe5] tracking-tight">
              {NAV_ITEMS.find((i) => i.href === pathname)?.label || "Dashboard"}
            </h1>
          </div>
          <button
            onClick={toggleTheme}
            className="w-9 h-9 flex items-center justify-center rounded-md border border-[#e6e0d4] dark:border-[#2e2a25] bg-white dark:bg-[#1a1815] text-base hover:bg-[#faf6f0] dark:hover:bg-[#2a2620]"
            aria-label="Toggle dark mode"
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
        </header>
        <main className="p-8 max-lg:p-4 flex-1">{children}</main>
      </div>
    </div>
  );
}

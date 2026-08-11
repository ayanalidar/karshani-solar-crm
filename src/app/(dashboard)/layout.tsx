"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: "◐" },
  { href: "/inventory", label: "Inventory", icon: "⊞" },
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
  { type: "group", label: "Operations" },
  { href: "/installations", label: "Installations", icon: "⚡" },
  { href: "/amc", label: "AMC & Warranty", icon: "🛡️" },
  { type: "group", label: "People" },
  { href: "/employees", label: "Employees", icon: "🧑‍💼" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen bg-[#faf6f0] max-w-[100vw] overflow-x-hidden">
      {/* Sidebar */}
      <aside
        className={`w-60 bg-[#f5efe5] border-r border-[#e6e0d4] flex flex-col shrink-0
          max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:z-50 max-lg:transition-transform
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
                className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === item.href
                    ? "bg-amber-50 text-amber-700"
                    : "text-[#504d44] hover:bg-[#faf6f0] hover:text-[#1c1915]"
                }`}
              >
                <span className="w-4 text-center text-xs">{item.icon}</span>
                {item.label}
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
      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-10 bg-[#faf6f0] border-b border-[#e6e0d4] px-8 py-4 flex items-center justify-between gap-4 max-lg:px-4">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden w-8 h-8 flex items-center justify-center rounded border border-[#e6e0d4] bg-white text-lg"
              onClick={() => setMobileOpen(true)}
            >
              ☰
            </button>
            <h1 className="font-serif text-xl text-[#1c1915] tracking-tight">
              {NAV_ITEMS.find((i) => i.href === pathname)?.label || "Dashboard"}
            </h1>
          </div>
        </header>
        <main className="p-8 max-lg:p-4">{children}</main>
      </div>
    </div>
  );
}

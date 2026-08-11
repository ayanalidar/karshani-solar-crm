"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/components/ThemeProvider";

type DebugInfo = {
  timestamp: string;
  environment: {
    DATABASE_URL_set: boolean;
    DIRECT_URL_set: boolean;
    AUTH_SECRET_set: boolean;
    NEXT_PUBLIC_SUPABASE_URL_set: boolean;
    NEXT_PUBLIC_SUPABASE_ANON_KEY_set: boolean;
    NODE_ENV: string;
  };
  database: {
    status: "ok" | "error" | "empty";
    productCount: number;
    error: string;
    connectionUrlMasked: string;
  };
  diagnosis: string[];
};

export function SettingsView() {
  const { theme, toggleTheme } = useTheme();
  const [debug, setDebug] = useState<DebugInfo | null>(null);
  const [debugLoading, setDebugLoading] = useState(false);
  const [cacheStatus, setCacheStatus] = useState("");
  const [backupStatus, setBackupStatus] = useState("");

  const fetchDebug = async () => {
    setDebugLoading(true);
    try {
      const res = await fetch("/api/debug");
      const data = await res.json();
      setDebug(data);
    } catch (e: any) {
      setDebug({
        timestamp: new Date().toISOString(),
        environment: {
          DATABASE_URL_set: false,
          DIRECT_URL_set: false,
          AUTH_SECRET_set: false,
          NEXT_PUBLIC_SUPABASE_URL_set: false,
          NEXT_PUBLIC_SUPABASE_ANON_KEY_set: false,
          NODE_ENV: "unknown",
        },
        database: { status: "error", productCount: 0, error: e.message, connectionUrlMasked: "" },
        diagnosis: [`Failed to fetch debug info: ${e.message}`],
      });
    } finally {
      setDebugLoading(false);
    }
  };

  useEffect(() => {
    fetchDebug();
  }, []);

  const clearCache = async () => {
    setCacheStatus("Clearing…");
    try {
      // 1. Clear all Cache API entries
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      // 2. Unregister all service workers
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
      // 3. Clear localStorage (but keep theme)
      const savedTheme = localStorage.getItem("karshani-theme");
      localStorage.clear();
      if (savedTheme) localStorage.setItem("karshani-theme", savedTheme);
      // 4. Clear sessionStorage
      sessionStorage.clear();
      setCacheStatus("✓ Cleared. Reloading…");
      setTimeout(() => window.location.reload(), 800);
    } catch (e: any) {
      setCacheStatus(`✗ Failed: ${e.message}`);
    }
  };

  const downloadBackup = async () => {
    setBackupStatus("Generating backup…");
    try {
      const res = await fetch("/api/backup");
      if (!res.ok) throw new Error(`Failed (${res.status})`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `karshani-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setBackupStatus("✓ Backup downloaded");
      setTimeout(() => setBackupStatus(""), 3000);
    } catch (e: any) {
      setBackupStatus(`✗ Failed: ${e.message}`);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <h2 className="font-serif text-lg">Settings</h2>

      {/* Appearance */}
      <section className="bg-white dark:bg-[#1a1815] border border-[#e6e0d4] dark:border-[#2e2a25] rounded-xl p-5">
        <h3 className="text-sm font-semibold mb-3">Appearance</h3>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">Dark Mode</div>
            <div className="text-xs text-[#787468] dark:text-[#9c958a]">
              Toggle between light and dark theme. All data, cards, and text remain fully visible in both modes.
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className={`relative w-14 h-7 rounded-full transition-colors ${
              theme === "dark" ? "bg-amber-600" : "bg-gray-300"
            }`}
            aria-label="Toggle dark mode"
          >
            <span
              className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${
                theme === "dark" ? "translate-x-7" : ""
              }`}
            >
              {theme === "dark" ? "🌙" : "☀️"}
            </span>
          </button>
        </div>
        <div className="mt-3 text-xs text-[#787468] dark:text-[#9c958a]">
          Current theme: <strong>{theme}</strong>
        </div>
      </section>

      {/* Data Management */}
      <section className="bg-white dark:bg-[#1a1815] border border-[#e6e0d4] dark:border-[#2e2a25] rounded-xl p-5">
        <h3 className="text-sm font-semibold mb-3">Data Management</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <div className="text-sm font-medium">Download Data Backup</div>
              <div className="text-xs text-[#787468] dark:text-[#9c958a]">
                Export all CRM data (customers, products, invoices, quotations, etc.) as a JSON file.
              </div>
            </div>
            <button
              onClick={downloadBackup}
              className="bg-amber-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-amber-700"
            >
              ↓ Download Backup
            </button>
          </div>
          {backupStatus && <div className="text-xs text-[#787468] dark:text-[#9c958a]">{backupStatus}</div>}

          <div className="border-t border-[#ede8dc] dark:border-[#2e2a25] pt-3 flex items-center justify-between flex-wrap gap-2">
            <div>
              <div className="text-sm font-medium">Clear Browser Cache</div>
              <div className="text-xs text-[#787468] dark:text-[#9c958a]">
                Clears service worker, cached files, and local storage (preserves your theme + login).
                Page will reload.
              </div>
            </div>
            <button
              onClick={clearCache}
              className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-red-700"
            >
              Clear Cache
            </button>
          </div>
          {cacheStatus && <div className="text-xs text-[#787468] dark:text-[#9c958a]">{cacheStatus}</div>}
        </div>
      </section>

      {/* Diagnostics */}
      <section className="bg-white dark:bg-[#1a1815] border border-[#e6e0d4] dark:border-[#2e2a25] rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">System Diagnostics</h3>
          <button
            onClick={fetchDebug}
            disabled={debugLoading}
            className="text-xs font-semibold text-amber-700 dark:text-amber-500 hover:underline disabled:opacity-50"
          >
            {debugLoading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
        {debug && (
          <div className="space-y-3 text-xs">
            <div>
              <div className="font-semibold mb-1">Environment Variables (Vercel):</div>
              <div className="grid grid-cols-1 gap-1 font-mono">
                <EnvRow label="DATABASE_URL" set={debug.environment.DATABASE_URL_set} />
                <EnvRow label="DIRECT_URL" set={debug.environment.DIRECT_URL_set} />
                <EnvRow label="AUTH_SECRET" set={debug.environment.AUTH_SECRET_set} />
                <EnvRow label="NEXT_PUBLIC_SUPABASE_URL" set={debug.environment.NEXT_PUBLIC_SUPABASE_URL_set} />
                <EnvRow label="NEXT_PUBLIC_SUPABASE_ANON_KEY" set={debug.environment.NEXT_PUBLIC_SUPABASE_ANON_KEY_set} />
              </div>
            </div>
            <div>
              <div className="font-semibold mb-1">Database Connection:</div>
              <div className="font-mono space-y-1">
                <div>Status: <StatusBadge status={debug.database.status} /></div>
                <div>Products found: <strong>{debug.database.productCount}</strong></div>
                <div>Connection URL: <span className="text-[#787468] dark:text-[#9c958a]">{debug.database.connectionUrlMasked}</span></div>
                {debug.database.error && (
                  <div className="text-red-600 dark:text-red-400 mt-2 p-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded">
                    {debug.database.error}
                  </div>
                )}
              </div>
            </div>
            {debug.diagnosis.length > 0 && (
              <div>
                <div className="font-semibold mb-1">Diagnosis:</div>
                <ul className="space-y-1">
                  {debug.diagnosis.map((d, i) => (
                    <li key={i} className="font-mono">{d}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </section>

      {/* About */}
      <section className="bg-white dark:bg-[#1a1815] border border-[#e6e0d4] dark:border-[#2e2a25] rounded-xl p-5">
        <h3 className="text-sm font-semibold mb-3">About</h3>
        <div className="text-xs text-[#787468] dark:text-[#9c958a] space-y-1">
          <div><strong>Karshani Solar CRM</strong> — v1.0</div>
          <div>Made & Maintained By: GuardianX</div>
          <div>Technologies: Next.js 16, Prisma, Supabase, Tailwind CSS v4</div>
        </div>
      </section>
    </div>
  );
}

function EnvRow({ label, set }: { label: string; set: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className={set ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
        {set ? "✓" : "✗"}
      </span>
      <span className={set ? "" : "text-red-600 dark:text-red-400"}>{label}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: "ok" | "error" | "empty" }) {
  const colors = {
    ok: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
    error: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
    empty: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
  };
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${colors[status]}`}>{status.toUpperCase()}</span>;
}

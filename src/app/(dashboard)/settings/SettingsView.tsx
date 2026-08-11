"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/components/ThemeProvider";

type DebugInfo = {
  timestamp: string;
  environment: Record<string, any>;
  prisma: { status: string; productCount: number; error: string };
  rawPg: { status: string; productCount: number; error: string; tablesInPublicSchema: string[] };
  connection: { urlMasked: string; host: string; isDirectSupabaseUrl: boolean; isPoolerUrl: boolean; projectRef: string };
  diagnosis: string[];
  fix: string[];
};

export function SettingsView() {
  const { theme, toggleTheme } = useTheme();
  const [debug, setDebug] = useState<DebugInfo | null>(null);
  const [debugLoading, setDebugLoading] = useState(false);
  const [cacheStatus, setCacheStatus] = useState("");
  const [backupStatus, setBackupStatus] = useState("");
  const [canInstall, setCanInstall] = useState(false);
  const [installMsg, setInstallMsg] = useState("");

  // Check PWA installability on mount
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      (window as any).__deferredPrompt = e;
      setCanInstall(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    // Also check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstallMsg("App is installed — running in standalone mode");
    }
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const triggerInstall = async () => {
    const dp = (window as any).__deferredPrompt;
    if (!dp) {
      setInstallMsg("Install prompt not available yet. Browse the app for ~30 seconds, then try again. On iOS, use Share → Add to Home Screen.");
      return;
    }
    dp.prompt();
    const choice = await dp.userChoice;
    if (choice.outcome === "accepted") {
      setInstallMsg("✓ App installed — check your home screen / app list");
      setCanInstall(false);
    } else {
      setInstallMsg("✗ Install cancelled");
    }
  };

  const fetchDebug = async () => {
    setDebugLoading(true);
    try {
      const res = await fetch("/api/debug");
      const data = await res.json();
      setDebug(data);
    } catch (e: any) {
      setDebug({
        timestamp: new Date().toISOString(),
        environment: {},
        prisma: { status: "error", productCount: 0, error: e.message },
        rawPg: { status: "error", productCount: 0, error: e.message, tablesInPublicSchema: [] },
        connection: { urlMasked: "", host: "", isDirectSupabaseUrl: false, isPoolerUrl: false, projectRef: "" },
        diagnosis: [`Failed to fetch debug info: ${e.message}`],
        fix: [],
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
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
      const savedTheme = localStorage.getItem("karshani-theme");
      localStorage.clear();
      if (savedTheme) localStorage.setItem("karshani-theme", savedTheme);
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

      {/* Install as App */}
      <section className="bg-white dark:bg-[#1a1815] border border-[#e6e0d4] dark:border-[#2e2a25] rounded-xl p-5">
        <h3 className="text-sm font-semibold mb-3">📱 Install as App</h3>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="text-sm font-medium">Add to Home Screen / Desktop</div>
            <div className="text-xs text-[#787468] dark:text-[#9c958a]">
              Install Karshani CRM as a native app — works offline, opens in its own window, no browser chrome.
            </div>
          </div>
          <button
            onClick={triggerInstall}
            disabled={!canInstall && !installMsg.includes("installed")}
            className="bg-amber-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-amber-700 disabled:opacity-50"
          >
            Install App
          </button>
        </div>
        {installMsg && (
          <div className="mt-2 text-xs text-[#787468] dark:text-[#9c958a]">{installMsg}</div>
        )}
        {!canInstall && !installMsg && (
          <div className="mt-2 text-xs text-[#787468] dark:text-[#9c958a]">
            On iOS: tap the Share button → &quot;Add to Home Screen&quot;. On desktop Chrome/Edge: look for the install icon in the address bar.
          </div>
        )}
      </section>

      {/* Appearance */}
      <section className="bg-white dark:bg-[#1a1815] border border-[#e6e0d4] dark:border-[#2e2a25] rounded-xl p-5">
        <h3 className="text-sm font-semibold mb-3">Appearance</h3>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">Dark Mode</div>
            <div className="text-xs text-[#787468] dark:text-[#9c958a]">
              All data, cards, and text remain fully visible in both modes.
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
                Export all CRM data as a JSON file.
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
                Clears service worker, cached files, and local storage (preserves theme + login).
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
                <div>Prisma: <StatusBadge status={debug.prisma.status} /> ({debug.prisma.productCount} products)</div>
                <div>Raw pg: <StatusBadge status={debug.rawPg.status} /> ({debug.rawPg.productCount} products)</div>
                <div>Host: <span className="text-[#787468] dark:text-[#9c958a]">{debug.connection.host || "—"}</span></div>
                {debug.connection.isDirectSupabaseUrl && (
                  <div className="text-orange-600 dark:text-orange-400 mt-1">
                    ⚠ Using direct Supabase URL — this may fail on Vercel (IPv6-only). Switch to pooler URL.
                  </div>
                )}
                {debug.connection.isPoolerUrl && (
                  <div className="text-green-600 dark:text-green-400 mt-1">
                    ✓ Using Supabase pooler URL — correct for Vercel.
                  </div>
                )}
                {(debug.prisma.error || debug.rawPg.error) && (
                  <div className="text-red-600 dark:text-red-400 mt-2 p-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded">
                    {debug.prisma.error || debug.rawPg.error}
                  </div>
                )}
              </div>
            </div>
            {debug.rawPg.tablesInPublicSchema && debug.rawPg.tablesInPublicSchema.length > 0 && (
              <div>
                <div className="font-semibold mb-1">Tables in public schema ({debug.rawPg.tablesInPublicSchema.length}):</div>
                <div className="font-mono text-[10px] text-[#787468] dark:text-[#9c958a] flex flex-wrap gap-1">
                  {debug.rawPg.tablesInPublicSchema.map((t) => (
                    <span key={t} className="px-1.5 py-0.5 bg-[#f5efe5] dark:bg-[#2a2620] rounded">{t}</span>
                  ))}
                </div>
              </div>
            )}
            {debug.diagnosis && debug.diagnosis.length > 0 && (
              <div>
                <div className="font-semibold mb-1">Diagnosis:</div>
                <ul className="space-y-1">
                  {debug.diagnosis.map((d, i) => (
                    <li key={i} className="font-mono">{d}</li>
                  ))}
                </ul>
              </div>
            )}
            {debug.fix && debug.fix.length > 0 && (
              <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded">
                <div className="font-semibold mb-1 text-amber-800 dark:text-amber-300">How to fix:</div>
                <pre className="whitespace-pre-wrap font-mono text-[11px] text-amber-900 dark:text-amber-200">{debug.fix.join("\n")}</pre>
              </div>
            )}
          </div>
        )}
      </section>

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

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    ok: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
    error: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
    empty: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
  };
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${colors[status] || colors.empty}`}>{status.toUpperCase()}</span>;
}

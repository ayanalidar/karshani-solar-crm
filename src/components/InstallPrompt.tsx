"use client";

import { useEffect, useState } from "react";

// Browser fires `beforeinstallprompt` when PWA install criteria are met
// (served over HTTPS, has manifest, has service worker, has engagement).
// We capture it and show a custom "Install App" banner at the top of
// the dashboard. After install (or dismiss), the banner hides.

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show banner only if user hasn't dismissed it this session
      const dismissedThisSession = sessionStorage.getItem("install-dismissed") === "1";
      if (!dismissedThisSession) setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setVisible(false);
    }
    setDeferredPrompt(null);
  };

  const dismiss = () => {
    setVisible(false);
    setDismissed(true);
    sessionStorage.setItem("install-dismissed", "1");
  };

  if (!visible || dismissed) return null;

  return (
    <div className="bg-amber-600 text-white px-4 py-2 flex items-center justify-between gap-3 text-sm">
      <div className="flex items-center gap-2">
        <span className="text-base">📱</span>
        <span>
          <strong>Install Karshani CRM</strong> — add to home screen for app-like experience.
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={install}
          className="bg-white text-amber-700 px-3 py-1 rounded-md text-xs font-semibold hover:bg-amber-50"
        >
          Install
        </button>
        <button
          onClick={dismiss}
          className="text-white/80 hover:text-white text-lg leading-none px-1"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  );
}

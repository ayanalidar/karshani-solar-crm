"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

// Detects the platform to give platform-specific install instructions:
// - Chrome/Edge Android + Desktop: native beforeinstallprompt
// - iOS Safari: manual "Add to Home Screen" instructions
// - Already installed (standalone): hides banner
export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [platform, setPlatform] = useState<"android" | "ios" | "desktop" | "other">("other");
  const [showIosInstructions, setShowIosInstructions] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed (running as PWA)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    if (isStandalone) {
      setInstalled(true);
      return;
    }

    // Detect platform
    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    const isAndroid = /Android/.test(ua);
    if (isIOS) setPlatform("ios");
    else if (isAndroid) setPlatform("android");
    else setPlatform("desktop");

    // Check if user previously dismissed (per session)
    const dismissed = sessionStorage.getItem("install-dismissed") === "1";
    if (dismissed) return;

    // Chrome/Edge fire beforeinstallprompt — capture it
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    const installedHandler = () => {
      setInstalled(true);
      setVisible(false);
    };
    window.addEventListener("appinstalled", installedHandler);

    // iOS doesn't fire beforeinstallprompt — show banner after delay
    if (isIOS && !dismissed) {
      const t = setTimeout(() => setVisible(true), 2500);
      return () => {
        clearTimeout(t);
        window.removeEventListener("beforeinstallprompt", handler);
        window.removeEventListener("appinstalled", installedHandler);
      };
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) {
      // No native prompt — show iOS instructions
      if (platform === "ios") setShowIosInstructions(true);
      return;
    }
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setInstalled(true);
      setVisible(false);
    } else {
      sessionStorage.setItem("install-dismissed", "1");
      setVisible(false);
    }
    setDeferredPrompt(null);
  };

  const dismiss = () => {
    setVisible(false);
    sessionStorage.setItem("install-dismissed", "1");
  };

  if (installed || !visible) return null;

  return (
    <>
      <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white px-4 py-2.5 flex items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base shrink-0">📱</span>
          <span className="min-w-0">
            <strong>Install Karshani CRM</strong>
            <span className="block text-[11px] text-white/85 truncate">
              {platform === "ios"
                ? "Add to Home Screen for app-like experience"
                : "Add to your device for instant access + offline mode"}
            </span>
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={install}
            className="bg-white text-amber-700 px-3 py-1.5 rounded-md text-xs font-semibold hover:bg-amber-50"
          >
            {platform === "ios" ? "How to Install" : "Install App"}
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

      {/* iOS instructions modal */}
      {showIosInstructions && (
        <div
          className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-4"
          onClick={() => setShowIosInstructions(false)}
        >
          <div
            className="bg-white dark:bg-[#1a1815] rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-serif text-lg mb-3 text-[#1c1915] dark:text-[#f5efe5]">
              Install on iPhone/iPad
            </h3>
            <ol className="text-sm space-y-2 text-[#504d44] dark:text-[#c8c0b3]">
              <li>
                <strong>1.</strong> Tap the{" "}
                <span className="inline-flex items-center justify-center w-6 h-6 rounded border border-[#e6e0d4] dark:border-[#2e2a25] text-xs">
                  ⋯
                </span>{" "}
                Share button at the bottom of Safari
              </li>
              <li>
                <strong>2.</strong> Scroll down and tap{" "}
                <strong>&quot;Add to Home Screen&quot;</strong>
              </li>
              <li>
                <strong>3.</strong> Tap <strong>&quot;Add&quot;</strong> in the top-right corner
              </li>
              <li>
                <strong>4.</strong> The Karshani CRM icon will appear on your home screen — tap it to launch like a native app
              </li>
            </ol>
            <button
              onClick={() => setShowIosInstructions(false)}
              className="mt-4 w-full bg-amber-600 text-white py-2 rounded-md text-sm font-semibold hover:bg-amber-700"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}

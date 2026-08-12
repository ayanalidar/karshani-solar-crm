"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleKey = (d: string) => {
    setError("");
    if (pin.length >= 4) return;
    const newPin = pin + d;
    setPin(newPin);
    if (newPin.length === 4) handleLogin(newPin);
  };

  const handleBackspace = () => {
    setError("");
    setPin(pin.slice(0, -1));
  };

  const handleLogin = async (p?: string) => {
    const pinToUse = p ?? pin;
    if (pinToUse.length !== 4) {
      setError("Enter a 4-digit PIN");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pinToUse }),
      });
      if (res.ok) {
        router.push("/");
        router.refresh();
      } else {
        setError("Wrong PIN. Try again.");
        setPin("");
      }
    } catch {
      setError("Connection error. Try again.");
      setPin("");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key >= "0" && e.key <= "9") handleKey(e.key);
    else if (e.key === "Backspace") handleBackspace();
    else if (e.key === "Enter" && pin.length === 4) handleLogin();
  };

  const pinComplete = pin.length === 4;

  return (
    <div
      className="min-h-screen bg-[#faf6f0] dark:bg-[#0c0a09] flex items-center justify-center p-4 outline-none"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div className="bg-white dark:bg-[#1c1917] border border-[#e6e0d4] dark:border-[#2e2a25] rounded-2xl p-6 sm:p-8 max-w-[300px] w-full text-center shadow-xl">
        {/* Logo */}
        <img
          src="/logo.jpeg"
          alt="KARSHANI ENTERPRISES"
          className="w-16 h-16 mx-auto rounded-full object-cover border-2 border-amber-100 shadow-md mb-3"
        />
        <h1 className="text-lg font-serif text-[#1c1915] dark:text-[#f5efe5] tracking-tight">KARSHANI</h1>
        <p className="text-[10px] text-[#787468] dark:text-[#a8a29e] uppercase tracking-widest mt-1 mb-5">
          Solar Management System
        </p>

        {/* PIN dots */}
        <div className="flex justify-center gap-2.5 mb-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-2.5 h-2.5 rounded-full border-2 transition-all ${
                error
                  ? "border-red-500 bg-red-500"
                  : i < pin.length
                  ? "border-amber-500 bg-amber-500"
                  : "border-[#e6e0d4] dark:border-[#3e3a35]"
              }`}
            />
          ))}
        </div>

        {/* Keypad — compact, mobile-style */}
        <div className="grid grid-cols-3 gap-1.5 mx-auto" style={{ maxWidth: "210px" }}>
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "back"].map((key, i) => (
            <button
              key={i}
              onClick={() => (key === "back" ? handleBackspace() : key && handleKey(key))}
              disabled={loading || !key}
              className={`rounded-lg border border-[#e6e0d4] dark:border-[#2e2a25] bg-white dark:bg-[#1c1917]
                text-[#1c1915] dark:text-[#f5efe5]
                hover:bg-amber-50 dark:hover:bg-[#2a2620] hover:border-amber-400
                active:bg-amber-100 dark:active:bg-amber-950/30 active:scale-95
                transition-all disabled:opacity-20 ${!key ? "invisible" : ""}
                flex items-center justify-center`}
              style={{ height: "38px", fontSize: "14px", fontWeight: 600 }}
            >
              {key === "back" ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-[#787468] dark:text-[#a8a29e]">
                  <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
                  <line x1="18" y1="9" x2="12" y2="15" />
                  <line x1="12" y1="9" x2="18" y2="15" />
                </svg>
              ) : (
                key
              )}
            </button>
          ))}
        </div>

        {/* Login button */}
        <button
          onClick={() => handleLogin()}
          disabled={!pinComplete || loading}
          className={`mt-4 w-full py-2 rounded-lg font-semibold text-[13px] transition-all ${
            pinComplete && !loading
              ? "bg-amber-600 text-white hover:bg-amber-700 active:scale-95 shadow-sm"
              : "bg-gray-100 dark:bg-[#2a2620] text-gray-400 dark:text-[#787468] cursor-not-allowed"
          }`}
        >
          {loading ? "Signing in…" : "Login"}
        </button>

        {error && <p className="text-red-500 text-xs mt-3">{error}</p>}
        <p className="text-[9px] text-gray-400 dark:text-[#787468] mt-3 tracking-wider">
          Made &amp; Maintained By: GuardianX
        </p>
      </div>
    </div>
  );
}

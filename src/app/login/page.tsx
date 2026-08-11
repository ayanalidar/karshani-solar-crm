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
    // Auto-submit when 4 digits entered (kept for fast UX) — but the
    // explicit Login button is also visible at 4 digits for users who
    // prefer to tap it manually.
    if (newPin.length === 4) {
      handleLogin(newPin);
    }
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

  // Allow keyboard input on desktops
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key >= "0" && e.key <= "9") {
      handleKey(e.key);
    } else if (e.key === "Backspace") {
      handleBackspace();
    } else if (e.key === "Enter" && pin.length === 4) {
      handleLogin();
    }
  };

  const pinComplete = pin.length === 4;

  return (
    <div
      className="min-h-screen bg-[#faf6f0] flex items-center justify-center p-4 outline-none"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div className="bg-white border border-[#e6e0d4] rounded-2xl p-8 max-w-sm w-full text-center shadow-xl">
        <img
          src="/logo.jpeg"
          alt="KARSHANI ENTERPRISES"
          className="w-24 h-24 mx-auto rounded-full object-cover border-4 border-amber-100 shadow-md mb-4"
        />
        <h1 className="text-2xl font-serif text-[#1c1915] tracking-tight">KARSHANI</h1>
        <p className="text-xs text-[#787468] uppercase tracking-widest mt-1 mb-8">
          Solar Management System
        </p>

        <div className="flex justify-center gap-3 mb-6">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${
                error
                  ? "border-red-600 bg-red-600"
                  : i < pin.length
                  ? "border-amber-600 bg-amber-600"
                  : "border-[#e6e0d4]"
              }`}
            />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2 max-w-56 mx-auto">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"].map((key, i) => (
            <button
              key={i}
              onClick={() => (key === "⌫" ? handleBackspace() : key && handleKey(key))}
              disabled={loading || !key}
              className={`aspect-square rounded-lg border border-[#e6e0d4] bg-white text-lg font-semibold
                hover:bg-[#faf6f0] hover:border-amber-600 active:bg-amber-50 active:scale-95 transition-all
                disabled:opacity-30 ${!key ? "invisible" : ""} ${
                key === "⌫" ? "text-xs text-gray-400" : ""
              }`}
            >
              {key}
            </button>
          ))}
        </div>

        {/* Login button — visible once 4-digit PIN is entered.
            Auto-submit still happens on 4th digit, but this gives a
            manual fallback for users who clear and re-type. */}
        <button
          onClick={() => handleLogin()}
          disabled={!pinComplete || loading}
          className={`mt-5 w-full py-3 rounded-lg font-semibold text-sm transition-all ${
            pinComplete && !loading
              ? "bg-amber-600 text-white hover:bg-amber-700 active:scale-95 shadow-md"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
        >
          {loading ? "Signing in…" : "Login"}
        </button>

        {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
        <p className="text-[10px] text-gray-400 mt-4 tracking-wider">
          Made &amp; Maintained By: GuardianX
        </p>
        <p className="text-[9px] text-gray-300 mt-1">
          Tip: type digits on keyboard or use the on-screen pad
        </p>
      </div>
    </div>
  );
}

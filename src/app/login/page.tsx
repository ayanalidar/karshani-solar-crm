"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleKey = (d: string) => {
    if (pin.length >= 4) return;
    const newPin = pin + d;
    setPin(newPin);
    if (newPin.length === 4) {
      handleLogin(newPin);
    }
  };

  const handleBackspace = () => setPin(pin.slice(0, -1));

  const handleLogin = async (p: string) => {
    setLoading(true);
    setError("");
    const result = await signIn("credentials", { pin: p, redirect: false });
    if (result?.error) {
      setError("Wrong PIN. Try again.");
      setPin("");
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-[#faf6f0] flex items-center justify-center p-4">
      <div className="bg-white border border-[#e6e0d4] rounded-2xl p-10 max-w-sm w-full text-center shadow-xl">
        <img src="/logo.jpeg" alt="KARSHANI ENTERPRISES" className="w-24 h-24 mx-auto rounded-full object-cover border-4 border-amber-100 shadow-md mb-4" />
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
        {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
        <p className="text-[10px] text-gray-400 mt-4 tracking-wider">
          Made & Maintained By: GuardianX
        </p>
      </div>
    </div>
  );
}

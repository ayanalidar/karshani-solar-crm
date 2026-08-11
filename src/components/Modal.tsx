"use client";

import { useEffect } from "react";

export function Modal({
  open,
  onClose,
  title,
  children,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    document.body.classList.add("modal-open");
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
      document.body.classList.remove("modal-open");
    };
  }, [open, onClose]);

  if (!open) return null;

  const sizeClass = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  }[size];

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
      style={{ overflowY: "auto" }}
    >
      <div
        className={`bg-white dark:bg-[#1a1815] border border-[#e6e0d4] dark:border-[#2e2a25] rounded-2xl shadow-2xl w-full ${sizeClass} max-h-[90vh] overflow-y-auto my-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e6e0d4] dark:border-[#2e2a25] sticky top-0 bg-white dark:bg-[#1a1815] z-10">
          <h2 className="font-serif text-lg text-[#1c1915] dark:text-[#f5efe5]">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded hover:bg-[#faf6f0] dark:hover:bg-[#2a2620] text-[#787468] dark:text-[#9c958a] hover:text-[#1c1915] dark:hover:text-[#f5efe5] text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

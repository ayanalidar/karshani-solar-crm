"use client";

import { useEffect } from "react";

// Print button component.
// - If autoPrint is true, automatically calls window.print() on mount
//   (used when the /pdf page is opened with ?print=true query param).
// - If recordPrintUrl is provided, fires a POST to that URL after the
//   print dialog is triggered (records printCount + printedAt).
export function PrintButton({
  autoPrint = false,
  recordPrintUrl,
}: {
  autoPrint?: boolean;
  recordPrintUrl?: string;
}) {
  useEffect(() => {
    if (!autoPrint) return;
    // Small delay to ensure the page is fully rendered before printing
    const t = setTimeout(() => {
      try {
        window.print();
      } catch (e) {
        console.warn("[print] failed:", e);
      }
    }, 500);
    return () => clearTimeout(t);
  }, [autoPrint]);

  const handlePrint = async () => {
    try {
      window.print();
      // Record the print event
      if (recordPrintUrl) {
        await fetch(recordPrintUrl, { method: "POST" }).catch((e) =>
          console.warn("[print] failed to record:", e)
        );
      }
    } catch (e) {
      console.warn("[print] failed:", e);
    }
  };

  // Also record the print when autoPrint fires
  useEffect(() => {
    if (autoPrint && recordPrintUrl) {
      fetch(recordPrintUrl, { method: "POST" }).catch((e) =>
        console.warn("[print] failed to record:", e)
      );
    }
  }, [autoPrint, recordPrintUrl]);

  return (
    <div className="no-print" style={{ marginTop: "20px", textAlign: "center" }}>
      <button
        onClick={handlePrint}
        style={{
          background: "#d97706",
          color: "white",
          padding: "8px 24px",
          border: "none",
          borderRadius: "4px",
          fontSize: "13px",
          fontWeight: "bold",
          cursor: "pointer",
        }}
      >
        🖨 Print / Save as PDF
      </button>
    </div>
  );
}

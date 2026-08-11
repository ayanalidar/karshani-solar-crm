"use client";

export function PrintButton() {
  return (
    <div className="no-print" style={{ marginTop: "20px", textAlign: "center" }}>
      <button
        onClick={() => window.print()}
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

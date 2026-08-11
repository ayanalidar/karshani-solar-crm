"use client";

import { useState, useEffect } from "react";
import { formatINR } from "@/lib/format";

type Slab = { slab: number; taxable: number; gst: number };
type Quarter = {
  id: string;
  label: string;
  invoiceCount: number;
  taxableValue: number;
  gstCollected: number;
  slabs: Slab[];
};
type GstReport = {
  fy: number;
  fyStart: string;
  fyEnd: string;
  quarterly: Quarter[];
  total: { invoiceCount: number; taxableValue: number; gstCollected: number };
};

export function GstReportView({ initialData }: { initialData: GstReport }) {
  const [fy, setFy] = useState(initialData.fy);
  const [data, setData] = useState<GstReport>(initialData);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (fy === initialData.fy) {
      setData(initialData);
      return;
    }
    setLoading(true);
    fetch(`/api/reports/gst?fy=${fy}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, [fy, initialData]);

  const currentYear = new Date().getFullYear();
  const fyOptions = [currentYear, currentYear - 1, currentYear - 2, currentYear - 3];

  const downloadCsv = () => {
    const rows = [
      ["Quarter", "Invoice Count", "Taxable Value (₹)", "GST Collected (₹)"],
      ...data.quarterly.map((q) => [
        q.label,
        q.invoiceCount.toString(),
        q.taxableValue.toFixed(2),
        q.gstCollected.toFixed(2),
      ]),
      ["TOTAL", data.total.invoiceCount.toString(), data.total.taxableValue.toFixed(2), data.total.gstCollected.toFixed(2)],
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `GST-FY${fy}-${fy + 1}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h2 className="font-serif text-lg">GST Report — FY {fy}-{fy + 1}</h2>
        <div className="flex items-center gap-2">
          <select
            value={fy}
            onChange={(e) => setFy(Number(e.target.value))}
            className="px-3 py-2 border border-[#e6e0d4] rounded-md text-sm"
          >
            {fyOptions.map((y) => (
              <option key={y} value={y}>
                FY {y}-{y + 1}
              </option>
            ))}
          </select>
          <button
            onClick={downloadCsv}
            className="bg-amber-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-amber-700"
          >
            ↓ Download CSV
          </button>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-sm text-amber-800">
        📅 Period: {data.fyStart} to {data.fyEnd} · Includes only <strong>paid</strong> invoices.
      </div>

      {/* Summary cards */}
      <div className="grid gap-3 mb-4 grid-cols-3 max-lg:grid-cols-1">
        <div className="bg-white border border-[#e6e0d4] rounded-xl p-4">
          <div className="text-[10px] text-[#787468] uppercase tracking-wider font-semibold mb-1">Invoices (Paid)</div>
          <div className="font-serif text-2xl">{data.total.invoiceCount}</div>
        </div>
        <div className="bg-white border border-[#e6e0d4] rounded-xl p-4">
          <div className="text-[10px] text-[#787468] uppercase tracking-wider font-semibold mb-1">Total Taxable Value</div>
          <div className="font-serif text-2xl">{formatINR(data.total.taxableValue)}</div>
        </div>
        <div className="bg-white border border-[#e6e0d4] rounded-xl p-4">
          <div className="text-[10px] text-[#787468] uppercase tracking-wider font-semibold mb-1">Total GST Collected</div>
          <div className="font-serif text-2xl text-amber-700">{formatINR(data.total.gstCollected)}</div>
        </div>
      </div>

      {/* Quarterly table */}
      <div className="bg-white border border-[#e6e0d4] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] text-[#787468] uppercase tracking-wider border-b border-[#e6e0d4]">
              <th className="text-left p-3">Quarter</th>
              <th className="text-right p-3">Invoices</th>
              <th className="text-right p-3">Taxable Value</th>
              <th className="text-right p-3">GST Collected</th>
              <th className="text-left p-3">Slab Breakdown</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="p-8 text-center text-[#787468]">Loading…</td></tr>
            ) : (
              data.quarterly.map((q) => (
                <tr key={q.id} className="border-b border-[#ede8dc] align-top">
                  <td className="p-3 font-semibold">{q.label}</td>
                  <td className="p-3 text-right">{q.invoiceCount}</td>
                  <td className="p-3 text-right">{formatINR(q.taxableValue)}</td>
                  <td className="p-3 text-right text-amber-700 font-semibold">{formatINR(q.gstCollected)}</td>
                  <td className="p-3 text-xs">
                    {q.slabs.length === 0 ? (
                      <span className="text-[#787468]">—</span>
                    ) : (
                      q.slabs.map((s) => (
                        <div key={s.slab} className="text-xs">
                          <span className="font-mono">{s.slab}%</span>: taxable {formatINR(s.taxable)} → GST {formatINR(s.gst)}
                        </div>
                      ))
                    )}
                  </td>
                </tr>
              ))
            )}
            <tr className="border-t-2 border-[#1c1915] font-bold">
              <td className="p-3">TOTAL (FY {fy}-{fy + 1})</td>
              <td className="p-3 text-right">{data.total.invoiceCount}</td>
              <td className="p-3 text-right">{formatINR(data.total.taxableValue)}</td>
              <td className="p-3 text-right text-amber-700">{formatINR(data.total.gstCollected)}</td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

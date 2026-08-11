"use client";

import { useState } from "react";
import { Modal } from "@/components/Modal";
import { QUOTATION_TEMPLATES, type QuotationTemplate } from "@/lib/quotation-templates";
import { formatINR } from "@/lib/format";

export function TemplatePicker({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (template: QuotationTemplate) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  const handlePick = (template: QuotationTemplate) => {
    onPick(template);
    setSelected(null);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Pick a Quotation Template" size="xl">
      <div className="space-y-3">
        <p className="text-xs text-[#787468] dark:text-[#9c958a] mb-3">
          Templates pre-fill the line items + system description. You can edit everything before saving.
        </p>
        {QUOTATION_TEMPLATES.map((tpl) => {
          const total = tpl.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
          const gst = tpl.items.reduce(
            (s, i) => s + (i.quantity * i.unitPrice * i.gstPercentage) / 100,
            0
          );
          const grand = total + gst;
          const isSelected = selected === tpl.id;
          return (
            <div
              key={tpl.id}
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                isSelected
                  ? "border-amber-600 bg-amber-50 dark:bg-amber-950/30"
                  : "border-[#e6e0d4] dark:border-[#2e2a25] hover:border-amber-400 dark:hover:border-amber-600"
              }`}
              onClick={() => setSelected(tpl.id)}
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm">{tpl.name}</h4>
                  <p className="text-xs text-[#787468] dark:text-[#9c958a] mt-0.5">{tpl.description}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {tpl.items.slice(0, 4).map((i, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] bg-[#f5efe5] dark:bg-[#2a2620] text-[#504d44] dark:text-[#c8c0b3] px-1.5 py-0.5 rounded"
                      >
                        {i.quantity}× {i.itemName.length > 25 ? i.itemName.slice(0, 25) + "…" : i.itemName}
                      </span>
                    ))}
                    {tpl.items.length > 4 && (
                      <span className="text-[10px] text-[#787468] dark:text-[#9c958a] px-1.5 py-0.5">
                        + {tpl.items.length - 4} more
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[10px] text-[#787468] dark:text-[#9c958a] uppercase tracking-wider">
                    {tpl.items.length} items
                  </div>
                  <div className="font-serif text-lg mt-0.5">{formatINR(grand)}</div>
                  <div className="text-[10px] text-[#787468] dark:text-[#9c958a]">
                    incl. GST {formatINR(gst)}
                  </div>
                </div>
              </div>
              {isSelected && (
                <div className="mt-3 pt-3 border-t border-amber-200 dark:border-amber-800 flex justify-end gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelected(null);
                    }}
                    className="text-xs px-3 py-1.5 rounded-md border border-[#e6e0d4] dark:border-[#2e2a25] text-[#504d44] dark:text-[#c8c0b3] hover:bg-[#faf6f0] dark:hover:bg-[#2a2620]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePick(tpl);
                    }}
                    className="text-xs px-3 py-1.5 rounded-md bg-amber-600 text-white font-semibold hover:bg-amber-700"
                  >
                    Use This Template →
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex justify-end mt-4 pt-3 border-t border-[#e6e0d4] dark:border-[#2e2a25]">
        <button
          onClick={onClose}
          className="text-sm px-4 py-2 rounded-md border border-[#e6e0d4] dark:border-[#2e2a25] text-[#504d44] dark:text-[#c8c0b3] hover:bg-[#faf6f0] dark:hover:bg-[#2a2620]"
        >
          Close
        </button>
      </div>
    </Modal>
  );
}

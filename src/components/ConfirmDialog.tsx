"use client";

import { Modal } from "./Modal";

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  danger = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-[#504d44]">{message}</p>
      <div className="flex justify-end gap-2 mt-5">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-md text-sm border border-[#e6e0d4] text-[#504d44] hover:bg-[#faf6f0]"
        >
          {cancelText}
        </button>
        <button
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className={`px-4 py-2 rounded-md text-sm font-semibold text-white ${
            danger ? "bg-red-600 hover:bg-red-700" : "bg-amber-600 hover:bg-amber-700"
          }`}
        >
          {confirmText}
        </button>
      </div>
    </Modal>
  );
}

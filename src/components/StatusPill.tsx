const COLORS: Record<string, string> = {
  new: "bg-blue-50 text-blue-600 border-blue-200",
  quoted: "bg-amber-50 text-amber-700 border-amber-200",
  sent: "bg-amber-50 text-amber-700 border-amber-200",
  negotiating: "bg-yellow-50 text-yellow-600 border-yellow-200",
  won: "bg-green-50 text-green-700 border-green-200",
  converted: "bg-green-50 text-green-700 border-green-200",
  lost: "bg-red-50 text-red-700 border-red-200",
  paid: "bg-green-50 text-green-700 border-green-200",
  due: "bg-yellow-50 text-yellow-600 border-yellow-200",
  overdue: "bg-red-50 text-red-700 border-red-200",
  pending: "bg-yellow-50 text-yellow-600 border-yellow-200",
  scheduled: "bg-blue-50 text-blue-600 border-blue-200",
  "in progress": "bg-yellow-50 text-yellow-600 border-yellow-200",
  completed: "bg-green-50 text-green-700 border-green-200",
  active: "bg-green-50 text-green-700 border-green-200",
  inactive: "bg-gray-50 text-gray-600 border-gray-200",
  credit: "bg-green-50 text-green-700 border-green-200",
  debit: "bg-red-50 text-red-700 border-red-200",
  AMC: "bg-purple-50 text-purple-700 border-purple-200",
  warranty: "bg-blue-50 text-blue-600 border-blue-200",
};

export function StatusPill({ status }: { status: string }) {
  const cls = COLORS[status?.toLowerCase()] || "bg-gray-50 text-gray-600 border-gray-200";
  return (
    <span
      className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-semibold border ${cls}`}
    >
      {status}
    </span>
  );
}

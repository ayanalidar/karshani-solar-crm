"use client";

export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative max-w-xs">
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-3 pr-3 py-2 border border-[#e6e0d4] rounded-md text-sm focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-200"
      />
    </div>
  );
}

"use client";

import { cn } from "@/lib/cn";
import type { RangeFilter, RangeKey } from "@/types/insights";

const OPTIONS: { key: RangeKey; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
  { key: "90d", label: "90 days" },
  { key: "custom", label: "Custom" },
];

/** Date range control: presets plus a custom from/to (inclusive, UTC days). */
export function RangePicker({
  value,
  onChange,
}: {
  value: RangeFilter;
  onChange: (value: RangeFilter) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div role="group" aria-label="Date range" className="flex rounded-lg ring-1 ring-slate-300">
        {OPTIONS.map((option) => (
          <button
            key={option.key}
            type="button"
            aria-pressed={value.range === option.key}
            onClick={() =>
              onChange(
                option.key === "custom"
                  ? { range: "custom", from: value.from ?? today, to: value.to ?? today }
                  : { range: option.key },
              )
            }
            className={cn(
              "px-3 py-1.5 text-sm first:rounded-l-lg last:rounded-r-lg",
              value.range === option.key
                ? "bg-brand-600 text-white"
                : "text-slate-600 hover:bg-slate-50",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
      {value.range === "custom" && (
        <div className="flex items-center gap-1 text-sm">
          <input
            type="date"
            aria-label="From"
            max={value.to ?? today}
            value={value.from ?? ""}
            onChange={(e) => onChange({ ...value, from: e.target.value })}
            className="h-8 rounded-lg border border-slate-300 px-2"
          />
          <span className="text-slate-400">–</span>
          <input
            type="date"
            aria-label="To"
            min={value.from}
            max={today}
            value={value.to ?? ""}
            onChange={(e) => onChange({ ...value, to: e.target.value })}
            className="h-8 rounded-lg border border-slate-300 px-2"
          />
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { formatCompact } from "@/lib/numbers";
import { CHART } from "./chart-tokens";

export interface BarRow {
  key: string;
  label: string;
  value: number;
  detail?: string;
}

/**
 * Horizontal bars for comparing categories on one measure: single colour, bars anchored to a
 * shared baseline with a 4px rounded data end, value labels in text ink, hover/focus detail.
 */
export function BarList({
  rows,
  ariaLabel,
  color = CHART.series[0],
}: {
  rows: BarRow[];
  ariaLabel: string;
  color?: string;
}) {
  const [active, setActive] = useState<string | null>(null);
  const max = Math.max(1, ...rows.map((row) => row.value));

  return (
    <ul className="space-y-3" aria-label={ariaLabel}>
      {rows.map((row) => (
        <li
          key={row.key}
          tabIndex={0}
          onMouseEnter={() => setActive(row.key)}
          onMouseLeave={() => setActive(null)}
          onFocus={() => setActive(row.key)}
          onBlur={() => setActive(null)}
          className="focus-visible:ring-brand-500 relative rounded focus:outline-none focus-visible:ring-2"
        >
          <div className="mb-1 flex justify-between text-xs">
            <span className="text-slate-700">{row.label}</span>
            <span className="font-medium text-slate-900 tabular-nums">
              {formatCompact(row.value)}
            </span>
          </div>
          <div className="h-2.5 w-full" aria-hidden="true">
            <div
              className="h-full rounded-r"
              style={{
                width: `${Math.max(row.value > 0 ? 1 : 0, (row.value / max) * 100)}%`,
                backgroundColor: color,
                borderRadius: "0 4px 4px 0",
              }}
            />
          </div>
          {active === row.key && row.detail && (
            <p
              role="status"
              className="absolute right-0 -bottom-6 z-10 rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 shadow"
            >
              {row.detail}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}

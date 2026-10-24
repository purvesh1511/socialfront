"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface ChartTable {
  columns: string[];
  rows: (string | number | null)[][];
}

interface ChartCardProps {
  title: string;
  description?: string;
  table: ChartTable;
  children: ReactNode;
  className?: string;
}

/** Card with a chart and an accessible "View as table" alternative. */
export function ChartCard({ title, description, table, children, className }: ChartCardProps) {
  const [showTable, setShowTable] = useState(false);

  return (
    <section className={cn("rounded-xl border border-slate-200 bg-white shadow-xs", className)}>
      <header className="flex flex-wrap items-start justify-between gap-3 px-5 pt-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
        </div>
        <button
          type="button"
          aria-pressed={showTable}
          onClick={() => setShowTable((value) => !value)}
          className="rounded-md px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700"
        >
          {showTable ? "View as chart" : "View as table"}
        </button>
      </header>
      <div className="p-5 pt-3">
        {showTable ? (
          <div className="max-h-80 overflow-auto">
            <table className="min-w-full text-sm">
              <caption className="sr-only">{title}</caption>
              <thead>
                <tr>
                  {table.columns.map((column) => (
                    <th
                      key={column}
                      scope="col"
                      className="sticky top-0 bg-white px-2 py-1.5 text-left text-xs font-semibold text-slate-500"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {table.rows.map((row, index) => (
                  <tr key={index}>
                    {row.map((cell, cellIndex) => (
                      <td
                        key={cellIndex}
                        className={cn(
                          "px-2 py-1.5 text-slate-700",
                          typeof cell === "number" && "text-right tabular-nums",
                        )}
                      >
                        {cell === null
                          ? "—"
                          : typeof cell === "number"
                            ? cell.toLocaleString()
                            : cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  );
}

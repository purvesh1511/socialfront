import { cn } from "@/lib/cn";
import type { UsageRow } from "@/types/billing";

const UNITS: Partial<Record<UsageRow["key"], string>> = { library_storage_mb: "MB" };

/** One bar per plan limit. Unlimited limits show the count only. */
export function UsageMeters({ usage }: { usage: UsageRow[] }) {
  return (
    <ul className="grid gap-5 sm:grid-cols-2">
      {usage.map((row) => {
        const unit = UNITS[row.key] ? ` ${UNITS[row.key]}` : "";
        const percent =
          row.limit === null
            ? 0
            : row.limit === 0
              ? 100
              : Math.min(100, (row.used / row.limit) * 100);
        const full = row.limit !== null && row.used >= row.limit;

        return (
          <li key={row.key}>
            <div className="mb-1.5 flex items-baseline justify-between gap-2 text-sm">
              <span className="font-medium text-slate-700">{row.label}</span>
              <span
                className={cn(
                  "tabular-nums",
                  full ? "font-semibold text-red-700" : "text-slate-600",
                )}
              >
                {row.used.toLocaleString()}
                {unit}
                {row.limit === null ? " · Unlimited" : ` / ${row.limit.toLocaleString()}${unit}`}
              </span>
            </div>
            <div
              role="progressbar"
              aria-label={row.label}
              aria-valuemin={0}
              aria-valuemax={row.limit ?? undefined}
              aria-valuenow={row.used}
              className="h-2 overflow-hidden rounded-full bg-slate-100"
            >
              {row.limit !== null && (
                <div
                  className={cn(
                    "h-full rounded-full",
                    full ? "bg-red-500" : percent >= 80 ? "bg-amber-500" : "bg-brand-600",
                  )}
                  style={{ width: `${percent}%` }}
                />
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

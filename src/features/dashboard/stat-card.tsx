export interface StatCardProps {
  label: string;
  value: number | string;
  hint?: string;
  /** Signed change shown with an arrow and words, never colour alone. */
  change?: { value: number; label: string } | null;
}

export function StatCard({ label, value, hint, change }: StatCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 tabular-nums">
        {value}
      </p>
      {change && (
        <p className="mt-1 text-xs text-slate-600">
          <span aria-hidden="true">{change.value > 0 ? "▲" : change.value < 0 ? "▼" : "■"}</span>{" "}
          {change.label}
        </p>
      )}
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

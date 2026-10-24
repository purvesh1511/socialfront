import { EmptyState } from "@/components/ui";
import { formatDateTime, humanize } from "@/lib/format";
import type { AuditLog } from "@/types/user";

export function ActivityList({
  items,
  showUser = false,
}: {
  items: AuditLog[];
  showUser?: boolean;
}) {
  if (items.length === 0) return <EmptyState title="No activity yet" />;

  return (
    <ul className="divide-y divide-slate-100">
      {items.map((log) => (
        <li key={log.id} className="flex items-center justify-between gap-4 py-3 text-sm">
          <div className="min-w-0">
            <p className="font-medium text-slate-800">{humanize(log.event)}</p>
            {showUser && log.user && <p className="truncate text-slate-500">{log.user.email}</p>}
          </div>
          <time dateTime={log.created_at} className="shrink-0 text-xs text-slate-400">
            {formatDateTime(log.created_at)}
          </time>
        </li>
      ))}
    </ul>
  );
}

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { EmptyState, Loading } from "@/components/ui";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/cn";
import { notificationsService } from "@/services/notifications.service";

const UNREAD_POLL_MS = 60_000;
const notificationKeys = {
  unread: ["notifications", "unread-count"] as const,
  list: ["notifications", "list"] as const,
};

export function NotificationBell() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const allHref = pathname.startsWith("/admin") ? "/admin/notifications" : "/notifications";
  const containerRef = useRef<HTMLDivElement>(null);

  const unread = useQuery({
    queryKey: notificationKeys.unread,
    queryFn: notificationsService.unreadCount,
    refetchInterval: UNREAD_POLL_MS,
  });
  const list = useQuery({
    queryKey: notificationKeys.list,
    queryFn: () => notificationsService.list({ page: 1 }),
    enabled: open,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["notifications"] });
  const markRead = useMutation({
    mutationFn: notificationsService.markAsRead,
    onSuccess: invalidate,
  });
  const markAll = useMutation({
    mutationFn: notificationsService.markAllAsRead,
    onSuccess: invalidate,
  });

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const count = unread.data?.count ?? 0;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label={`Notifications${count ? `, ${count} unread` : ""}`}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100"
      >
        <span aria-hidden="true">🔔</span>
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-80 rounded-xl border border-slate-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-semibold">Notifications</h2>
            {count > 0 && (
              <button
                type="button"
                onClick={() => markAll.mutate()}
                className="text-brand-600 hover:text-brand-700 text-xs font-medium"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {list.isLoading ? (
              <Loading />
            ) : !list.data?.items.length ? (
              <EmptyState title="You're all caught up" />
            ) : (
              <ul className="divide-y divide-slate-100">
                {list.data.items.map((notification) => (
                  <li key={notification.id}>
                    <button
                      type="button"
                      onClick={() => {
                        if (!notification.read_at) markRead.mutate(notification.id);
                        if (notification.data.url?.startsWith("/")) {
                          setOpen(false);
                          router.push(notification.data.url);
                        }
                      }}
                      className={cn(
                        "block w-full px-4 py-3 text-left hover:bg-slate-50",
                        !notification.read_at && "bg-brand-50/50",
                      )}
                    >
                      <p className="text-sm font-medium text-slate-900">
                        {notification.data.title ?? notification.type}
                      </p>
                      {notification.data.message && (
                        <p className="mt-0.5 text-sm text-slate-600">{notification.data.message}</p>
                      )}
                      <p className="mt-1 text-xs text-slate-400">
                        {formatDateTime(notification.created_at)}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <Link
            href={allHref}
            onClick={() => setOpen(false)}
            className="text-brand-600 hover:text-brand-700 block border-t border-slate-100 px-4 py-2.5 text-center text-sm font-medium"
          >
            View all
          </Link>
        </div>
      )}
    </div>
  );
}

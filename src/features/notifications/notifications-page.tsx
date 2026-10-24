"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageHeader } from "@/components/layouts/page-header";
import { Button, Card, EmptyState, ErrorState, Loading, Pagination } from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/format";
import { notificationsService } from "@/services/notifications.service";

export function NotificationsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const list = useQuery({
    queryKey: ["notifications", "page", { page, unreadOnly }],
    queryFn: () => notificationsService.list({ page, unread: unreadOnly }),
    placeholderData: keepPreviousData,
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

  return (
    <>
      <PageHeader
        title="Notifications"
        actions={
          <Button variant="secondary" loading={markAll.isPending} onClick={() => markAll.mutate()}>
            Mark all as read
          </Button>
        }
      />
      <Card bodyClassName="p-0">
        <div className="border-b border-slate-100 p-4">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              className="accent-brand-600 size-4"
              checked={unreadOnly}
              onChange={(event) => {
                setUnreadOnly(event.target.checked);
                setPage(1);
              }}
            />
            Unread only
          </label>
        </div>
        {list.isLoading ? (
          <Loading />
        ) : list.error ? (
          <ErrorState error={list.error} onRetry={() => void list.refetch()} />
        ) : !list.data?.items.length ? (
          <EmptyState title={unreadOnly ? "No unread notifications" : "No notifications yet"} />
        ) : (
          <ul className="divide-y divide-slate-100">
            {list.data.items.map((notification) => (
              <li
                key={notification.id}
                className={cn(
                  "flex flex-wrap items-start gap-4 px-5 py-4",
                  !notification.read_at && "bg-brand-50/40",
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900">
                    {!notification.read_at && <span className="sr-only">Unread: </span>}
                    {notification.data.title ?? notification.type}
                  </p>
                  {notification.data.message && (
                    <p className="mt-0.5 text-sm text-slate-600">{notification.data.message}</p>
                  )}
                  <p className="mt-1 text-xs text-slate-400">
                    {formatDateTime(notification.created_at)}
                  </p>
                </div>
                <div className="flex gap-2">
                  {notification.data.url?.startsWith("/") && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        if (!notification.read_at) markRead.mutate(notification.id);
                        router.push(notification.data.url as string);
                      }}
                    >
                      Open
                    </Button>
                  )}
                  {!notification.read_at && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => markRead.mutate(notification.id)}
                    >
                      Mark read
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
        <Pagination meta={list.data?.meta} onPageChange={setPage} />
      </Card>
    </>
  );
}

"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addDays, addMonths, addWeeks, format, isSameMonth, isToday } from "date-fns";
import Link from "next/link";
import { useState, type DragEvent } from "react";
import { PageHeader } from "@/components/layouts/page-header";
import { Button, Card, ErrorState, Loading, Select } from "@/components/ui";
import { POST_STATUS_LABELS, PLATFORM_STYLES } from "@/constants/social";
import { ROUTES } from "@/constants/routes";
import { usePlatforms, useSocialAccounts } from "@/features/social-accounts/hooks";
import { errorMessage } from "@/lib/api-error";
import {
  daysInRange,
  droppedTime,
  postDate,
  postsOnDay,
  rangeLabel,
  visibleRange,
  type CalendarView,
} from "@/lib/calendar";
import { cn } from "@/lib/cn";
import { canReschedule } from "@/lib/post-validation";
import { postsService } from "@/services/posts.service";
import { toast } from "@/stores/toast.store";
import type { Post } from "@/types/social";

const HOURS = Array.from({ length: 24 }, (_, hour) => hour);
const STATUS_STYLES: Partial<Record<Post["status"], string>> = {
  scheduled: "border-brand-200 bg-brand-50 text-brand-800",
  published: "border-emerald-200 bg-emerald-50 text-emerald-800",
  failed: "border-red-200 bg-red-50 text-red-800",
  publishing: "border-amber-200 bg-amber-50 text-amber-800",
  pending_approval: "border-dashed border-amber-300 bg-white text-amber-800",
};

export function CalendarPage() {
  const queryClient = useQueryClient();
  const accounts = useSocialAccounts();
  const platforms = usePlatforms();
  const [view, setView] = useState<CalendarView>("month");
  const [anchor, setAnchor] = useState(() => new Date());
  const [filters, setFilters] = useState({ platform: "", account_id: "", status: "" });

  const { start, end } = visibleRange(view, anchor);
  const params = {
    from: start.toISOString(),
    to: end.toISOString(),
    platform: filters.platform || undefined,
    account_id: filters.account_id ? Number(filters.account_id) : undefined,
    status: filters.status || undefined,
  };
  const posts = useQuery({
    queryKey: ["calendar", params],
    queryFn: () => postsService.calendar(params),
    placeholderData: keepPreviousData,
  });

  const reschedule = useMutation({
    mutationFn: ({ id, at }: { id: number; at: Date }) =>
      postsService.reschedule(id, at.toISOString()),
    onSuccess: ({ message }) => toast.success(message),
    onError: (error) => toast.error(errorMessage(error)),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["calendar"] });
      void queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  const move = (direction: 1 | -1) =>
    setAnchor((current) =>
      view === "month"
        ? addMonths(current, direction)
        : view === "week"
          ? addWeeks(current, direction)
          : addDays(current, direction),
    );

  const onDrop = (event: DragEvent, day: Date, hour?: number) => {
    event.preventDefault();
    const id = Number(event.dataTransfer.getData("text/post-id"));
    const post = posts.data?.find((item) => item.id === id);
    const original = post ? postDate(post) : null;
    if (!post || !original) return;

    const at = droppedTime(original, day, hour);
    if (at.getTime() <= Date.now()) {
      toast.error("Posts can only be moved to a future time.");
      return;
    }
    if (at.getTime() !== original.getTime()) reschedule.mutate({ id, at });
  };

  return (
    <>
      <PageHeader
        title="Calendar"
        description="Drag scheduled posts to a new day or time."
        actions={
          <Link
            href={ROUTES.posts.create}
            className="bg-brand-600 hover:bg-brand-700 rounded-lg px-4 py-2 text-sm font-medium text-white"
          >
            Create post
          </Link>
        }
      />
      <Card bodyClassName="p-0">
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
          <div className="flex items-center gap-1">
            <Button size="sm" variant="secondary" onClick={() => move(-1)} aria-label="Previous">
              ←
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setAnchor(new Date())}>
              Today
            </Button>
            <Button size="sm" variant="secondary" onClick={() => move(1)} aria-label="Next">
              →
            </Button>
          </div>
          <h2 className="min-w-48 text-base font-semibold text-slate-900" aria-live="polite">
            {rangeLabel(view, anchor)}
          </h2>
          <div
            role="group"
            aria-label="Calendar view"
            className="flex rounded-lg ring-1 ring-slate-300"
          >
            {(["month", "week", "day"] as const).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={view === option}
                onClick={() => setView(option)}
                className={cn(
                  "px-3 py-1.5 text-sm capitalize first:rounded-l-lg last:rounded-r-lg",
                  view === option ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-50",
                )}
              >
                {option}
              </button>
            ))}
          </div>
          <div className="ml-auto flex flex-wrap gap-2">
            <div className="w-40">
              <Select
                aria-label="Platform"
                placeholder="All platforms"
                value={filters.platform}
                onChange={(e) => setFilters({ ...filters, platform: e.target.value })}
                options={(platforms.data ?? []).map((p) => ({ value: p.key, label: p.name }))}
              />
            </div>
            <div className="w-44">
              <Select
                aria-label="Account"
                placeholder="All accounts"
                value={filters.account_id}
                onChange={(e) => setFilters({ ...filters, account_id: e.target.value })}
                options={(accounts.data ?? []).map((a) => ({ value: String(a.id), label: a.name }))}
              />
            </div>
            <div className="w-36">
              <Select
                aria-label="Status"
                placeholder="All statuses"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                options={(["scheduled", "published", "failed", "publishing"] as const).map((s) => ({
                  value: s,
                  label: POST_STATUS_LABELS[s],
                }))}
              />
            </div>
          </div>
        </div>

        {posts.isLoading ? (
          <Loading />
        ) : posts.error ? (
          <ErrorState error={posts.error} onRetry={() => void posts.refetch()} />
        ) : view === "month" ? (
          <MonthGrid
            days={daysInRange(start, end)}
            anchor={anchor}
            posts={posts.data ?? []}
            onDrop={onDrop}
          />
        ) : (
          <TimeGrid days={daysInRange(start, end)} posts={posts.data ?? []} onDrop={onDrop} />
        )}
      </Card>
    </>
  );
}

function PostChip({ post, compact = false }: { post: Post; compact?: boolean }) {
  const draggable = canReschedule(post.status);
  const date = postDate(post);

  return (
    <Link
      href={ROUTES.posts.detail(post.id)}
      draggable={draggable}
      onDragStart={(event) => event.dataTransfer.setData("text/post-id", String(post.id))}
      title={`${POST_STATUS_LABELS[post.status]} · ${post.content ?? ""}`}
      className={cn(
        "flex items-center gap-1 truncate rounded border px-1.5 py-0.5 text-xs",
        STATUS_STYLES[post.status] ?? "border-slate-200 bg-white text-slate-700",
        draggable && "cursor-grab active:cursor-grabbing",
      )}
    >
      <span className="flex shrink-0 -space-x-1">
        {post.targets.slice(0, 3).map((target) => (
          <span
            key={target.id}
            className={cn(
              "size-2.5 rounded-full ring-1 ring-white",
              PLATFORM_STYLES[target.account.platform.key].className,
            )}
          />
        ))}
      </span>
      {date && <span className="shrink-0 font-medium">{format(date, "HH:mm")}</span>}
      {!compact && <span className="truncate">{post.content || "(media)"}</span>}
    </Link>
  );
}

const allowDrop = (event: DragEvent) => event.preventDefault();

function MonthGrid({
  days,
  anchor,
  posts,
  onDrop,
}: {
  days: Date[];
  anchor: Date;
  posts: Post[];
  onDrop: (e: DragEvent, day: Date) => void;
}) {
  return (
    <div className="grid grid-cols-7 text-sm">
      {days.slice(0, 7).map((day) => (
        <div
          key={`h-${day.toISOString()}`}
          className="border-b border-slate-100 px-2 py-2 text-center text-xs font-semibold text-slate-500 uppercase"
        >
          {format(day, "EEE")}
        </div>
      ))}
      {days.map((day) => {
        const dayPosts = postsOnDay(posts, day);
        return (
          <div
            key={day.toISOString()}
            onDragOver={allowDrop}
            onDrop={(event) => onDrop(event, day)}
            className={cn(
              "min-h-28 space-y-1 border-r border-b border-slate-100 p-1.5",
              !isSameMonth(day, anchor) && "bg-slate-50/70",
            )}
          >
            <span
              className={cn(
                "inline-flex size-6 items-center justify-center rounded-full text-xs",
                isToday(day) ? "bg-brand-600 font-semibold text-white" : "text-slate-500",
              )}
            >
              {format(day, "d")}
            </span>
            {dayPosts.slice(0, 4).map((post) => (
              <PostChip key={post.id} post={post} />
            ))}
            {dayPosts.length > 4 && (
              <p className="px-1 text-xs text-slate-500">+{dayPosts.length - 4} more</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function TimeGrid({
  days,
  posts,
  onDrop,
}: {
  days: Date[];
  posts: Post[];
  onDrop: (e: DragEvent, day: Date, hour: number) => void;
}) {
  return (
    <div className="max-h-[70vh] overflow-auto">
      <div
        className="grid min-w-[640px]"
        style={{ gridTemplateColumns: `4rem repeat(${days.length}, minmax(0, 1fr))` }}
      >
        <div className="sticky top-0 z-10 border-b border-slate-100 bg-white" />
        {days.map((day) => (
          <div
            key={day.toISOString()}
            className={cn(
              "sticky top-0 z-10 border-b border-slate-100 bg-white px-2 py-2 text-center text-xs font-semibold",
              isToday(day) ? "text-brand-700" : "text-slate-500",
            )}
          >
            {format(day, "EEE d")}
          </div>
        ))}
        {HOURS.map((hour) => (
          <div key={hour} className="contents">
            <div className="border-r border-b border-slate-100 px-2 py-1 text-right text-xs text-slate-400">
              {format(new Date(2000, 0, 1, hour), "HH:mm")}
            </div>
            {days.map((day) => (
              <div
                key={`${day.toISOString()}-${hour}`}
                onDragOver={allowDrop}
                onDrop={(event) => onDrop(event, day, hour)}
                className="min-h-12 space-y-1 border-r border-b border-slate-100 p-1"
              >
                {postsOnDay(posts, day)
                  .filter((post) => postDate(post)?.getHours() === hour)
                  .map((post) => (
                    <PostChip key={post.id} post={post} compact={days.length > 1} />
                  ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

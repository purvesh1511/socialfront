import {
  addDays,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import type { Post } from "@/types/social";

export type CalendarView = "month" | "week" | "day";

/** Visible date range for a view, in local time. */
export function visibleRange(view: CalendarView, anchor: Date): { start: Date; end: Date } {
  if (view === "day") {
    const start = startOfDay(anchor);
    return { start, end: addDays(start, 1) };
  }
  if (view === "week") {
    const start = startOfWeek(anchor);
    return { start, end: addDays(start, 7) };
  }
  const start = startOfWeek(startOfMonth(anchor));
  return { start, end: startOfDay(addDays(endOfWeek(endOfMonth(anchor)), 1)) };
}

export function daysInRange(start: Date, end: Date): Date[] {
  const days: Date[] = [];
  for (let day = start; day < end; day = addDays(day, 1)) days.push(day);
  return days;
}

/** The time a post appears on the calendar: published time, else scheduled time. */
export function postDate(post: Post): Date | null {
  const value = post.published_at ?? post.scheduled_at;
  return value ? new Date(value) : null;
}

export function postsOnDay(posts: Post[], day: Date): Post[] {
  return posts
    .filter((post) => {
      const date = postDate(post);
      return date !== null && isSameDay(date, day);
    })
    .sort((a, b) => (postDate(a)?.getTime() ?? 0) - (postDate(b)?.getTime() ?? 0));
}

/**
 * New time for a post dropped on a day (keep its time of day) or on an hour (keep its minutes).
 */
export function droppedTime(original: Date, day: Date, hour?: number): Date {
  const next = new Date(day);
  next.setHours(hour ?? original.getHours(), original.getMinutes(), 0, 0);
  return next;
}

export function rangeLabel(view: CalendarView, anchor: Date): string {
  if (view === "day") return format(anchor, "EEEE, MMMM d, yyyy");
  if (view === "week") {
    const { start, end } = visibleRange("week", anchor);
    return `${format(start, "MMM d")} – ${format(addDays(end, -1), "MMM d, yyyy")}`;
  }
  return format(anchor, "MMMM yyyy");
}

/** Converts a `datetime-local` input value (local time) to an ISO string. */
export function localInputToIso(value: string): string {
  return new Date(value).toISOString();
}

/** Converts an ISO string to a `datetime-local` input value in local time. */
export function isoToLocalInput(iso: string | null): string {
  if (!iso) return "";
  return format(new Date(iso), "yyyy-MM-dd'T'HH:mm");
}

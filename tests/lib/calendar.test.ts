import { describe, expect, it } from "vitest";
import { daysInRange, droppedTime, postsOnDay, visibleRange } from "@/lib/calendar";
import type { Post } from "@/types/social";

const post = (id: number, scheduled: string | null, published: string | null = null) =>
  ({ id, scheduled_at: scheduled, published_at: published }) as Post;

describe("visibleRange", () => {
  it("covers whole weeks around the month", () => {
    const { start, end } = visibleRange("month", new Date(2026, 9, 15));
    expect(start.getDay()).toBe(0);
    expect(end.getDay()).toBe(0);
    expect(start <= new Date(2026, 9, 1)).toBe(true);
    expect(end > new Date(2026, 9, 31)).toBe(true);
    expect(daysInRange(start, end).length % 7).toBe(0);
  });

  it("returns seven days for a week and one for a day", () => {
    const week = visibleRange("week", new Date(2026, 9, 15));
    expect(daysInRange(week.start, week.end)).toHaveLength(7);
    const day = visibleRange("day", new Date(2026, 9, 15, 13));
    expect(daysInRange(day.start, day.end)).toHaveLength(1);
  });
});

describe("droppedTime", () => {
  const original = new Date(2026, 9, 15, 9, 30);

  it("keeps the time of day when dropped on a day", () => {
    expect(droppedTime(original, new Date(2026, 9, 20))).toEqual(new Date(2026, 9, 20, 9, 30));
  });

  it("keeps the minutes when dropped on an hour", () => {
    expect(droppedTime(original, new Date(2026, 9, 20), 14)).toEqual(new Date(2026, 9, 20, 14, 30));
  });
});

describe("postsOnDay", () => {
  it("uses published time first and sorts by time", () => {
    const day = new Date(2026, 9, 15);
    const posts = [
      post(1, new Date(2026, 9, 15, 18).toISOString()),
      post(2, new Date(2026, 9, 14, 9).toISOString(), new Date(2026, 9, 15, 8).toISOString()),
      post(3, new Date(2026, 9, 16, 9).toISOString()),
      post(4, null),
    ];
    expect(postsOnDay(posts, day).map((p) => p.id)).toEqual([2, 1]);
  });
});

import { describe, expect, it } from "vitest";
import { addSlot, removeSlot, slotsForDay } from "@/lib/schedule";

describe("schedule slots", () => {
  const slots = [
    { day_of_week: 1, time: "18:00" },
    { day_of_week: 1, time: "09:00" },
    { day_of_week: 2, time: "10:00" },
  ];

  it("lists a day's slots in order", () => {
    expect(slotsForDay(slots, 1)).toEqual(["09:00", "18:00"]);
    expect(slotsForDay(slots, 0)).toEqual([]);
  });

  it("adds without duplicates and removes", () => {
    expect(addSlot(slots, 1, "09:00")).toBe(slots);
    expect(addSlot(slots, 0, "08:00")).toHaveLength(4);
    expect(removeSlot(slots, 1, "09:00")).toEqual([slots[0], slots[2]]);
  });
});

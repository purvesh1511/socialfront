import type { ScheduleSlot } from "@/types/social";

export function slotsForDay(slots: ScheduleSlot[], day: number): string[] {
  return slots
    .filter((slot) => slot.day_of_week === day)
    .map((slot) => slot.time)
    .sort();
}

/** Adds a slot, ignoring duplicates. */
export function addSlot(slots: ScheduleSlot[], day: number, time: string): ScheduleSlot[] {
  if (slots.some((slot) => slot.day_of_week === day && slot.time === time)) return slots;
  return [...slots, { day_of_week: day, time }];
}

export function removeSlot(slots: ScheduleSlot[], day: number, time: string): ScheduleSlot[] {
  return slots.filter((slot) => !(slot.day_of_week === day && slot.time === time));
}

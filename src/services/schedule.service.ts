import type { PublishingSchedule, QueueEntry } from "@/types/social";
import { get, send } from "./api-client";

export const scheduleService = {
  get: () => get<PublishingSchedule>("/customer/publishing-schedule"),
  update: (schedule: PublishingSchedule) =>
    send<PublishingSchedule>("put", "/customer/publishing-schedule", schedule),
  upcoming: () => get<QueueEntry[]>("/customer/publishing-schedule/queue"),
};

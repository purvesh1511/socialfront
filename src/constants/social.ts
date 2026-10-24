import type { PlatformKey, PostStatus } from "@/types/social";

/** Brand-neutral accent per network (used for badges and preview headers). */
export const PLATFORM_STYLES: Record<PlatformKey, { short: string; className: string }> = {
  facebook: { short: "FB", className: "bg-blue-600 text-white" },
  instagram: { short: "IG", className: "bg-pink-600 text-white" },
  linkedin: { short: "in", className: "bg-sky-700 text-white" },
  x: { short: "X", className: "bg-slate-900 text-white" },
  tiktok: { short: "TT", className: "bg-slate-800 text-white" },
  youtube: { short: "YT", className: "bg-red-600 text-white" },
  pinterest: { short: "P", className: "bg-red-700 text-white" },
  threads: { short: "@", className: "bg-slate-700 text-white" },
  bluesky: { short: "BS", className: "bg-sky-500 text-white" },
  google_business: { short: "G", className: "bg-emerald-600 text-white" },
};

export const POST_STATUS_LABELS: Record<PostStatus, string> = {
  draft: "Draft",
  pending_approval: "Pending approval",
  approved: "Approved",
  scheduled: "Scheduled",
  publishing: "Publishing",
  published: "Published",
  failed: "Failed",
  cancelled: "Cancelled",
};

export const POST_STATUS_TONES: Record<
  PostStatus,
  "neutral" | "success" | "warning" | "danger" | "brand"
> = {
  draft: "neutral",
  pending_approval: "warning",
  approved: "brand",
  scheduled: "brand",
  publishing: "warning",
  published: "success",
  failed: "danger",
  cancelled: "neutral",
};

export const APPROVAL_ACTION_LABELS: Record<"schedule" | "queue" | "publish_now", string> = {
  schedule: "Schedule for a specific time",
  queue: "Add to the queue",
  publish_now: "Publish immediately",
};

export const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export const MEDIA_ACCEPT = "image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime";
export const IMAGE_MAX_BYTES = 10 * 1024 * 1024;
export const VIDEO_MAX_BYTES = 200 * 1024 * 1024;

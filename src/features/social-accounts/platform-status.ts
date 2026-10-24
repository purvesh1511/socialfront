import type { PlatformStatus } from "@/types/social";

export const PLATFORM_STATUS_TONES = {
  verified: "success",
  limited: "brand",
  implemented_pending_credentials: "neutral",
  approval_required: "warning",
  unsupported: "danger",
  verification_expired: "warning",
} as const satisfies Record<PlatformStatus, string>;

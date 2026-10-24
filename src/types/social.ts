export type PlatformKey =
  | "facebook"
  | "instagram"
  | "linkedin"
  | "x"
  | "tiktok"
  | "youtube"
  | "pinterest"
  | "threads"
  | "bluesky"
  | "google_business";

export interface PlatformCapabilities {
  max_characters: number;
  max_images: number;
  max_videos: number;
  supports_gif: boolean;
  requires_media: boolean;
  requires_video: boolean;
  requires_image: boolean;
  allows_mixed_media: boolean;
}

/** Capability-registry status; only verified and limited platforms receive automated publish jobs. */
export type PlatformStatus =
  | "verified"
  | "limited"
  | "implemented_pending_credentials"
  | "approval_required"
  | "unsupported"
  | "verification_expired";

export interface Platform {
  key: PlatformKey;
  name: string;
  auth_type: "oauth2" | "credentials";
  status: PlatformStatus;
  status_label: string;
  can_connect: boolean;
  can_publish: boolean;
  capabilities: PlatformCapabilities;
  supports_analytics: boolean;
}

export type SocialAccountStatus = "active" | "reauthorization_required";

export interface SocialAccount {
  id: number;
  platform: { key: PlatformKey; name: string };
  name: string;
  username: string | null;
  avatar_url: string | null;
  account_type: string;
  status: SocialAccountStatus;
  last_error: string | null;
  connected_at: string | null;
  is_disconnected: boolean;
  token_expires_at?: string | null;
  granted_scopes?: string[];
  settings?: { boards?: { id: string; name: string }[]; default_board_id?: string | null };
}

export type MediaType = "image" | "gif" | "video";

export interface Media {
  id: number;
  type: MediaType;
  url: string;
  mime_type: string;
  original_name: string;
  size: number;
  width: number | null;
  height: number | null;
}

export type PostStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "scheduled"
  | "publishing"
  | "published"
  | "failed"
  | "cancelled";

export type TargetStatus =
  | "pending"
  | "publishing"
  | "retrying"
  | "published"
  | "failed"
  | "auth_required"
  | "unknown_result";

export interface TargetOptions {
  title?: string | null;
  board_id?: string | null;
  privacy?: "public" | "unlisted" | "private" | null;
  privacy_level?: string | null;
  alt_text?: string | null;
}

export interface PublishLogEntry {
  id: number;
  status: "success" | "failed" | "unknown";
  attempt: number;
  platform_post_id: string | null;
  error_message: string | null;
  will_retry: boolean;
  created_at: string;
}

export interface PostTarget {
  id: number;
  social_account_id: number;
  account: SocialAccount;
  status: TargetStatus;
  content: string | null;
  options: TargetOptions | null;
  platform_post_id: string | null;
  platform_post_url: string | null;
  attempts: number;
  last_attempt_at: string | null;
  next_retry_at: string | null;
  error_message: string | null;
  published_at: string | null;
  publish_logs?: PublishLogEntry[];
}

export interface PostHistoryEntry {
  id: number;
  from_status: PostStatus | null;
  to_status: PostStatus;
  note: string | null;
  user: string | null;
  created_at: string;
}

export interface Post {
  id: number;
  content: string | null;
  link_url: string | null;
  status: PostStatus;
  is_editable: boolean;
  scheduled_at: string | null;
  published_at: string | null;
  is_queued: boolean;
  media: Media[];
  targets: PostTarget[];
  history?: PostHistoryEntry[];
  approval?: Approval | null;
  issues?: Record<string, string[]>;
  created_at: string | null;
  updated_at: string | null;
}

export type PostAction = "draft" | "schedule" | "queue" | "publish_now";

export interface PostInput {
  content: string;
  link_url: string | null;
  media_ids: number[];
  targets: { social_account_id: number; content?: string | null; options?: TargetOptions | null }[];
  action: PostAction;
  scheduled_at?: string | null;
}

export interface PostFilters {
  page?: number;
  per_page?: number;
  status?: string;
  account_id?: number;
  platform?: string;
  search?: string;
  sort?: string;
  direction?: "asc" | "desc";
}

export interface ScheduleSlot {
  day_of_week: number;
  time: string;
}

export interface PublishingSchedule {
  timezone: string;
  slots: ScheduleSlot[];
}

export interface QueueEntry {
  slot_at: string;
  post: Post;
}

export type ApprovalStatus = "pending" | "approved" | "rejected" | "withdrawn";
export type ApprovalAction = "schedule" | "queue" | "publish_now";

export interface ApprovalComment {
  id: number;
  body: string;
  user: string | null;
  is_staff: boolean;
  created_at: string | null;
}

export interface Approval {
  id: number;
  post_id: number;
  status: ApprovalStatus;
  requested_action: ApprovalAction;
  requested_scheduled_at: string | null;
  requester?: { id: number; name: string; email: string };
  reviewer?: { id: number; name: string } | null;
  reviewed_at: string | null;
  decision_note: string | null;
  comments?: ApprovalComment[];
  history?: {
    id: number;
    action: string;
    note: string | null;
    user: string | null;
    created_at: string;
  }[];
  post?: Post;
  post_issues?: Record<string, string[]>;
  created_at: string | null;
}

export interface NotificationPreference {
  event: string;
  label: string;
  email: boolean;
}

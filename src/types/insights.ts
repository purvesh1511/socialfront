import type { SocialAccount } from "./social";

export type MetricKey =
  | "likes"
  | "comments"
  | "shares"
  | "saves"
  | "reach"
  | "impressions"
  | "engagement"
  | "video_views"
  | "clicks";

export type Metrics = Record<MetricKey, number>;
export type RangeKey = "today" | "7d" | "30d" | "90d" | "custom";

export interface RangeFilter {
  range: RangeKey;
  from?: string;
  to?: string;
}

export interface AnalyticsOverview {
  range: { from: string; to: string };
  totals: Metrics & {
    posts: number;
    followers: number;
    follower_change: number;
    engagement_rate: number;
  };
  timeseries: (Metrics & { date: string; followers: number | null; posts: number })[];
  platforms: (Metrics & {
    platform: string;
    name: string;
    accounts: number;
    followers: number;
    posts: number;
  })[];
  accounts: (Metrics & {
    account: SocialAccount;
    followers: number | null;
    synced_at: string | null;
    supports_analytics: boolean;
  })[];
  top_posts: (Metrics & {
    post_id: number;
    content: string;
    thumbnail: string | null;
    account: SocialAccount;
    url: string | null;
    published_on: string;
  })[];
  last_synced_at: string | null;
}

export type ReportType = "account" | "platform" | "post" | "monthly" | "customer";
export type ReportFormat = "pdf" | "csv" | "xlsx";

export interface Report {
  id: number;
  type: ReportType;
  type_label: string;
  format: ReportFormat;
  status: "pending" | "processing" | "completed" | "failed";
  parameters: { from: string; to: string; account_id?: number; platform?: string };
  filename: string;
  file_size: number | null;
  error_message: string | null;
  completed_at: string | null;
  created_at: string | null;
}

export interface ContentItem {
  id: number;
  kind: "media" | "text";
  title: string;
  body: string | null;
  folder_id: number | null;
  media_type: "image" | "gif" | "video" | null;
  url: string | null;
  mime_type: string | null;
  original_name: string | null;
  size: number | null;
  width: number | null;
  height: number | null;
  tags: string[];
  usage_count: number;
  last_used_at: string | null;
  created_at: string | null;
}

export interface ContentFolder {
  id: number;
  name: string;
  parent_id: number | null;
  items_count: number;
}

export interface LibraryFilters {
  page?: number;
  folder_id?: string;
  kind?: string;
  media_type?: string;
  tag?: string;
  search?: string;
  sort?: string;
}

export type AiFeature =
  "caption" | "rewrite" | "shorten" | "expand" | "hashtags" | "variations" | "adapt" | "ideas";

export interface AiResult {
  id: number;
  label: string | null;
  text: string;
}

export interface AiUsage {
  period: string;
  used: number;
  limit: number;
  remaining: number;
  configured: boolean;
}

export interface AiGeneration {
  id: number;
  feature: AiFeature;
  results: AiResult[];
  created_at: string;
  usage?: AiUsage;
}

export interface AiRequestInput {
  feature: AiFeature;
  text?: string;
  topic?: string;
  tone?: string | null;
  platforms?: string[];
  count?: number;
  brand_voice_id?: number | null;
}

export interface BrandVoice {
  id: number;
  name: string;
  description: string;
  is_default: boolean;
}

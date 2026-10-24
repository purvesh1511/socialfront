import type { Media, Platform, PostStatus, SocialAccount } from "@/types/social";

/** Unicode-aware character count (matches PHP mb_strlen). */
export function countCharacters(text: string): number {
  return Array.from(text).length;
}

export function extractHashtags(text: string): string[] {
  return Array.from(new Set(text.match(/(^|\s)#[\p{L}\p{N}_]+/gu)?.map((tag) => tag.trim()) ?? []));
}

export function extractMentions(text: string): string[] {
  return Array.from(new Set(text.match(/(^|\s)@[\w.]+/g)?.map((mention) => mention.trim()) ?? []));
}

/**
 * Client-side mirror of the API's PostContentValidator so the composer can warn early.
 * The API remains authoritative.
 */
export function validateForPlatform(text: string, media: Media[], platform: Platform): string[] {
  const caps = platform.capabilities;
  const name = platform.name;
  const errors: string[] = [];
  const length = countCharacters(text);
  const videos = media.filter((item) => item.type === "video").length;
  const gifs = media.filter((item) => item.type === "gif").length;
  const images = media.length - videos;

  if (!platform.can_publish) {
    return [`Automated publishing to ${name} is unavailable (${platform.status_label}).`];
  }
  if (length > caps.max_characters) {
    errors.push(`${name} allows up to ${caps.max_characters} characters (${length} used).`);
  }
  if (text.trim() === "" && media.length === 0) errors.push(`Add text or media for ${name}.`);
  if (caps.requires_media && media.length === 0) errors.push(`${name} requires an image or video.`);
  if (caps.requires_video && videos === 0) errors.push(`${name} requires a video.`);
  if (caps.requires_image && images === 0) errors.push(`${name} requires an image.`);
  if (videos > caps.max_videos) {
    errors.push(
      caps.max_videos === 0
        ? `${name} does not support video posts yet.`
        : `${name} allows ${caps.max_videos} video per post.`,
    );
  }
  if (images > caps.max_images) {
    errors.push(
      caps.max_images === 0
        ? `${name} does not support image posts.`
        : `${name} allows up to ${caps.max_images} image(s) per post.`,
    );
  }
  if (gifs > 0 && !caps.supports_gif) errors.push(`${name} does not support GIFs.`);
  if (videos > 0 && images > 0 && !caps.allows_mixed_media)
    errors.push(`${name} cannot mix images and video in one post.`);

  return errors;
}

export function accountIssues(account: SocialAccount): string | null {
  if (account.is_disconnected) return `${account.name} has been disconnected.`;
  if (account.status !== "active") return `${account.name} needs to be reconnected before posting.`;
  return null;
}

export function canReschedule(status: PostStatus): boolean {
  return status === "scheduled";
}

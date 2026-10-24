import { describe, expect, it } from "vitest";
import {
  accountIssues,
  countCharacters,
  extractHashtags,
  extractMentions,
  validateForPlatform,
} from "@/lib/post-validation";
import type { Media, Platform, SocialAccount } from "@/types/social";

const platform = (overrides: Partial<Platform["capabilities"]> = {}, name = "X"): Platform => ({
  key: "x",
  name,
  auth_type: "oauth2",
  status: "verified",
  status_label: "Verified",
  can_connect: true,
  can_publish: true,
  supports_analytics: true,
  capabilities: {
    max_characters: 280,
    max_images: 4,
    max_videos: 0,
    supports_gif: true,
    requires_media: false,
    requires_video: false,
    requires_image: false,
    allows_mixed_media: false,
    ...overrides,
  },
});

const media = (type: Media["type"]): Media => ({
  id: Math.random(),
  type,
  url: "https://cdn/x",
  mime_type: type === "video" ? "video/mp4" : "image/png",
  original_name: "x",
  size: 1,
  width: null,
  height: null,
});

describe("countCharacters", () => {
  it("counts unicode code points like mb_strlen", () => {
    expect(countCharacters("héllo")).toBe(5);
    expect(countCharacters("🚀🚀")).toBe(2);
  });
});

describe("hashtags and mentions", () => {
  it("extracts unique hashtags and mentions", () => {
    expect(extractHashtags("Ship it #laravel #nextjs #laravel")).toEqual(["#laravel", "#nextjs"]);
    expect(extractMentions("Thanks @jane and @acme.co")).toEqual(["@jane", "@acme.co"]);
    expect(extractHashtags("email#notatag")).toEqual([]);
  });
});

describe("validateForPlatform", () => {
  it("blocks platforms that cannot receive automated publishing", () => {
    const unverified = {
      ...platform(),
      can_publish: false,
      status_label: "Provider approval required",
    };
    expect(validateForPlatform("Hello", [], unverified)).toEqual([
      "Automated publishing to X is unavailable (Provider approval required).",
    ]);
  });

  it("flags text over the limit", () => {
    expect(validateForPlatform("a".repeat(281), [], platform())).toEqual([
      "X allows up to 280 characters (281 used).",
    ]);
  });

  it("requires text or media", () => {
    expect(validateForPlatform("  ", [], platform())).toContain("Add text or media for X.");
  });

  it("enforces media requirements", () => {
    const instagram = platform({ requires_media: true, max_images: 1, max_videos: 1 }, "Instagram");
    expect(validateForPlatform("Hi", [], instagram)).toContain(
      "Instagram requires an image or video.",
    );
    expect(validateForPlatform("Hi", [media("image"), media("image")], instagram)).toContain(
      "Instagram allows up to 1 image(s) per post.",
    );
  });

  it("rejects unsupported video and mixed media", () => {
    expect(validateForPlatform("Hi", [media("video")], platform())).toContain(
      "X does not support video posts yet.",
    );
    const facebook = platform({ max_videos: 1 }, "Facebook");
    expect(validateForPlatform("Hi", [media("video"), media("image")], facebook)).toContain(
      "Facebook cannot mix images and video in one post.",
    );
  });

  it("passes a valid post", () => {
    expect(validateForPlatform("Hello", [media("image")], platform())).toEqual([]);
  });
});

describe("accountIssues", () => {
  it("reports accounts that cannot post", () => {
    const account = {
      name: "Acme",
      status: "reauthorization_required",
      is_disconnected: false,
    } as SocialAccount;
    expect(accountIssues(account)).toBe("Acme needs to be reconnected before posting.");
    expect(accountIssues({ ...account, status: "active" })).toBeNull();
  });
});

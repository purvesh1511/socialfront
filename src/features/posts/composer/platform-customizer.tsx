"use client";

import { useState } from "react";
import { Input, Select } from "@/components/ui";
import { cn } from "@/lib/cn";
import { countCharacters } from "@/lib/post-validation";
import type { Platform, SocialAccount, TargetOptions } from "@/types/social";
import { AccountAvatar } from "@/features/social-accounts/account-avatar";

export interface Variant {
  content: string;
  options: TargetOptions;
}

interface PlatformCustomizerProps {
  accounts: SocialAccount[];
  platforms: Platform[];
  baseContent: string;
  variants: Record<number, Variant>;
  onChange: (accountId: number, variant: Variant) => void;
}

/** Per-account overrides: custom text and network-specific options. */
export function PlatformCustomizer({
  accounts,
  platforms,
  baseContent,
  variants,
  onChange,
}: PlatformCustomizerProps) {
  const [activeId, setActiveId] = useState<number | null>(null);
  const active = accounts.find((account) => account.id === activeId) ?? accounts[0];

  if (!active) return null;

  const variant = variants[active.id] ?? { content: "", options: {} };
  const platform = platforms.find((p) => p.key === active.platform.key);
  const limit = platform?.capabilities.max_characters;
  const text = variant.content || baseContent;
  const update = (patch: Partial<Variant>) => onChange(active.id, { ...variant, ...patch });
  const updateOption = (key: keyof TargetOptions, value: string) =>
    update({ options: { ...variant.options, [key]: value || null } });

  return (
    <div>
      <div role="tablist" aria-label="Customise per account" className="mb-3 flex flex-wrap gap-1">
        {accounts.map((account) => (
          <button
            key={account.id}
            type="button"
            role="tab"
            aria-selected={account.id === active.id}
            onClick={() => setActiveId(account.id)}
            className={cn(
              "flex items-center gap-2 rounded-lg px-2 py-1 text-sm",
              account.id === active.id
                ? "bg-brand-50 text-brand-800"
                : "text-slate-600 hover:bg-slate-100",
            )}
          >
            <AccountAvatar account={account} size="sm" />
            <span className="max-w-28 truncate">{account.name}</span>
            {variants[account.id]?.content && (
              <span className="bg-brand-500 size-1.5 rounded-full" aria-label="customised" />
            )}
          </button>
        ))}
      </div>

      <div role="tabpanel" className="space-y-3">
        <div className="space-y-1">
          <label htmlFor="variant-content" className="block text-sm font-medium text-slate-700">
            Custom text for {active.platform.name}
          </label>
          <textarea
            id="variant-content"
            rows={4}
            value={variant.content}
            placeholder="Leave empty to use the main text"
            onChange={(event) => update({ content: event.target.value })}
            className="focus:border-brand-500 focus:ring-brand-100 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:outline-none"
          />
          {limit !== undefined && (
            <p
              className={cn(
                "text-xs",
                countCharacters(text) > limit ? "text-red-600" : "text-slate-500",
              )}
            >
              {countCharacters(text)} / {limit}
            </p>
          )}
        </div>

        {(active.platform.key === "youtube" || active.platform.key === "pinterest") && (
          <Input
            label="Title"
            maxLength={100}
            value={variant.options.title ?? ""}
            onChange={(e) => updateOption("title", e.target.value)}
          />
        )}
        {active.platform.key === "youtube" && (
          <Select
            label="Visibility"
            value={variant.options.privacy ?? "public"}
            onChange={(e) => updateOption("privacy", e.target.value)}
            options={[
              { value: "public", label: "Public" },
              { value: "unlisted", label: "Unlisted" },
              { value: "private", label: "Private" },
            ]}
          />
        )}
        {active.platform.key === "tiktok" && (
          <Select
            label="Who can view"
            value={variant.options.privacy_level ?? "SELF_ONLY"}
            onChange={(e) => updateOption("privacy_level", e.target.value)}
            options={[
              { value: "SELF_ONLY", label: "Only me" },
              { value: "MUTUAL_FOLLOW_FRIENDS", label: "Friends" },
              { value: "FOLLOWER_OF_CREATOR", label: "Followers" },
              { value: "PUBLIC_TO_EVERYONE", label: "Everyone" },
            ]}
          />
        )}
        {active.platform.key === "pinterest" && (
          <Select
            label="Board"
            placeholder="Default board"
            value={variant.options.board_id ?? ""}
            onChange={(e) => updateOption("board_id", e.target.value)}
            options={(active.settings?.boards ?? []).map((board) => ({
              value: board.id,
              label: board.name,
            }))}
          />
        )}
        {(active.platform.key === "bluesky" || active.platform.key === "x") && (
          <Input
            label="Image alt text"
            maxLength={1000}
            value={variant.options.alt_text ?? ""}
            onChange={(e) => updateOption("alt_text", e.target.value)}
          />
        )}
      </div>
    </div>
  );
}

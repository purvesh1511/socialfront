import { cn } from "@/lib/cn";
import { countCharacters } from "@/lib/post-validation";
import type { Platform } from "@/types/social";
import { PlatformBadge } from "@/features/social-accounts/platform-badge";

/** Shows used/limit for each selected network, turning red when over. */
export function CharacterMeter({ text, platforms }: { text: string; platforms: Platform[] }) {
  const used = countCharacters(text);

  return (
    <div className="flex flex-wrap items-center gap-3 text-xs" aria-live="polite">
      <span className="text-slate-500">{used} characters</span>
      {platforms.map((platform) => {
        const over = used > platform.capabilities.max_characters;
        return (
          <span
            key={platform.key}
            className={cn(
              "flex items-center gap-1",
              over ? "font-semibold text-red-600" : "text-slate-500",
            )}
          >
            <PlatformBadge platform={platform.key} className="size-4 text-[8px]" />
            {platform.capabilities.max_characters - used}
          </span>
        );
      })}
    </div>
  );
}

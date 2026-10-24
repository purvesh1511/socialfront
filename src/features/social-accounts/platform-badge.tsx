import { PLATFORM_STYLES } from "@/constants/social";
import { cn } from "@/lib/cn";
import type { PlatformKey } from "@/types/social";

export function PlatformBadge({
  platform,
  className,
}: {
  platform: PlatformKey;
  className?: string;
}) {
  const style = PLATFORM_STYLES[platform];
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex size-5 shrink-0 items-center justify-center rounded text-[10px] font-bold",
        style.className,
        className,
      )}
    >
      {style.short}
    </span>
  );
}

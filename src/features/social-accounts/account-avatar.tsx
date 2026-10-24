import { cn } from "@/lib/cn";
import type { SocialAccount } from "@/types/social";
import { PlatformBadge } from "./platform-badge";

export function AccountAvatar({
  account,
  size = "md",
}: {
  account: SocialAccount;
  size?: "sm" | "md";
}) {
  const dimension = size === "sm" ? "size-7" : "size-10";

  return (
    <span
      className="relative inline-flex shrink-0"
      title={`${account.name} · ${account.platform.name}`}
    >
      {account.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element -- avatars come from many provider CDNs
        <img
          src={account.avatar_url}
          alt=""
          className={cn(dimension, "rounded-full object-cover")}
        />
      ) : (
        <span
          className={cn(
            dimension,
            "flex items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-600",
          )}
        >
          {account.name.charAt(0).toUpperCase()}
        </span>
      )}
      <PlatformBadge
        platform={account.platform.key}
        className="absolute -right-1 -bottom-1 size-4 text-[8px] ring-2 ring-white"
      />
    </span>
  );
}

import { PLATFORM_STYLES } from "@/constants/social";
import { cn } from "@/lib/cn";
import type { Media, SocialAccount } from "@/types/social";
import { AccountAvatar } from "@/features/social-accounts/account-avatar";
import { RichText } from "./rich-text";

interface PostPreviewProps {
  account: SocialAccount;
  text: string;
  media: Media[];
  linkUrl: string;
  title?: string | null;
}

/** An approximate, network-flavoured preview. Exact rendering is up to each network. */
export function PostPreview({ account, text, media, linkUrl, title }: PostPreviewProps) {
  const accent = PLATFORM_STYLES[account.platform.key].className;
  let domain = "";
  try {
    domain = linkUrl ? new URL(linkUrl).hostname : "";
  } catch {
    domain = "";
  }

  return (
    <article className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <header className={cn("px-3 py-1 text-[11px] font-semibold tracking-wide uppercase", accent)}>
        {account.platform.name}
      </header>
      <div className="space-y-3 p-3">
        <div className="flex items-center gap-2">
          <AccountAvatar account={account} size="sm" />
          <div className="min-w-0 text-sm">
            <p className="truncate font-semibold text-slate-900">{account.name}</p>
            <p className="text-xs text-slate-400">Just now</p>
          </div>
        </div>
        {title && <p className="text-sm font-semibold text-slate-900">{title}</p>}
        {text ? (
          <RichText text={text} />
        ) : (
          <p className="text-sm text-slate-400 italic">Your text will appear here.</p>
        )}
        {media.length > 0 && (
          <div
            className={cn(
              "grid gap-1 overflow-hidden rounded-lg",
              media.length > 1 ? "grid-cols-2" : "grid-cols-1",
            )}
          >
            {media.slice(0, 4).map((item) =>
              item.type === "video" ? (
                <video
                  key={item.id}
                  src={item.url}
                  className="aspect-video w-full bg-black object-cover"
                  muted
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element -- user uploads on the API host
                <img
                  key={item.id}
                  src={item.url}
                  alt=""
                  className="aspect-square w-full object-cover"
                />
              ),
            )}
          </div>
        )}
        {domain && media.length === 0 && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
            {domain}
          </div>
        )}
      </div>
    </article>
  );
}

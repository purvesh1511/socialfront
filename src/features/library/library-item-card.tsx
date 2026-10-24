import { cn } from "@/lib/cn";
import type { ContentItem } from "@/types/insights";

export function LibraryItemCard({
  item,
  onSelect,
  selected = false,
}: {
  item: ContentItem;
  onSelect: () => void;
  selected?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "group hover:border-brand-400 flex w-full flex-col overflow-hidden rounded-xl border bg-white text-left shadow-xs",
        selected ? "border-brand-500 ring-brand-200 ring-2" : "border-slate-200",
      )}
    >
      <div className="relative aspect-square w-full bg-slate-100">
        {item.kind === "text" ? (
          <p className="line-clamp-6 p-3 text-xs whitespace-pre-wrap text-slate-600">{item.body}</p>
        ) : item.media_type === "video" ? (
          <video src={item.url ?? undefined} className="size-full object-cover" muted />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- user uploads on the API host
          <img src={item.url ?? undefined} alt="" className="size-full object-cover" />
        )}
        <span className="absolute top-2 left-2 rounded bg-black/60 px-1.5 text-[10px] font-medium text-white uppercase">
          {item.kind === "text" ? "snippet" : item.media_type}
        </span>
      </div>
      <div className="p-2">
        <p className="truncate text-sm font-medium text-slate-800">{item.title}</p>
        {item.tags.length > 0 && (
          <p className="truncate text-xs text-slate-500">
            {item.tags.map((t) => `#${t}`).join(" ")}
          </p>
        )}
      </div>
    </button>
  );
}

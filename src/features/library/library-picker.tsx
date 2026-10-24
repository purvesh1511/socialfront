"use client";

import { useState } from "react";
import { EmptyState, Input, Loading, Modal, Pagination } from "@/components/ui";
import { useDebounce } from "@/hooks/use-debounce";
import { errorMessage } from "@/lib/api-error";
import { cn } from "@/lib/cn";
import { libraryService } from "@/services/library.service";
import { toast } from "@/stores/toast.store";
import type { Media } from "@/types/social";
import type { ContentItem } from "@/types/insights";
import { useLibraryItems } from "./hooks";
import { LibraryItemCard } from "./library-item-card";

interface LibraryPickerProps {
  open: boolean;
  onClose: () => void;
  onMedia: (media: Media) => void;
  onText: (text: string) => void;
}

/** Composer dialog: attach library media (copied into the post) or insert a text snippet. */
export function LibraryPicker({ open, onClose, onMedia, onText }: LibraryPickerProps) {
  const [kind, setKind] = useState<"media" | "text">("media");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState<number | null>(null);
  const debounced = useDebounce(search);
  const items = useLibraryItems({ kind, page, search: debounced || undefined });

  const choose = async (item: ContentItem) => {
    setBusy(item.id);
    try {
      const { data } = await libraryService.use(item.id);
      if (item.kind === "media") onMedia(data as Media);
      else onText((data as ContentItem).body ?? "");
      onClose();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(null);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add from library">
      <div className="space-y-3">
        <div className="flex gap-2">
          <div
            role="tablist"
            aria-label="Item type"
            className="flex rounded-lg ring-1 ring-slate-300"
          >
            {(["media", "text"] as const).map((value) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={kind === value}
                onClick={() => {
                  setKind(value);
                  setPage(1);
                }}
                className={cn(
                  "px-3 py-1.5 text-sm first:rounded-l-lg last:rounded-r-lg",
                  kind === value ? "bg-brand-600 text-white" : "text-slate-600",
                )}
              >
                {value === "media" ? "Media" : "Snippets"}
              </button>
            ))}
          </div>
          <div className="flex-1">
            <Input
              type="search"
              aria-label="Search library"
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        {items.isLoading ? (
          <Loading />
        ) : !items.data?.items.length ? (
          <EmptyState title="Nothing found" description="Add items on the Library page." />
        ) : (
          <div className="grid max-h-96 grid-cols-3 gap-2 overflow-y-auto">
            {items.data.items.map((item) => (
              <div key={item.id} className={cn(busy === item.id && "opacity-50")}>
                <LibraryItemCard item={item} onSelect={() => void choose(item)} />
              </div>
            ))}
          </div>
        )}
        <Pagination meta={items.data?.meta} onPageChange={setPage} />
      </div>
    </Modal>
  );
}

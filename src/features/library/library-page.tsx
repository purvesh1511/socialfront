"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { PageHeader } from "@/components/layouts/page-header";
import {
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Input,
  Loading,
  Modal,
  Pagination,
  Select,
  Spinner,
} from "@/components/ui";
import { MEDIA_ACCEPT } from "@/constants/social";
import { useDebounce } from "@/hooks/use-debounce";
import { errorMessage, toApiError } from "@/lib/api-error";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";
import { formatBytes } from "@/lib/numbers";
import { libraryService } from "@/services/library.service";
import { toast } from "@/stores/toast.store";
import type { ContentFolder, ContentItem } from "@/types/insights";
import {
  libraryKeys,
  parseTags,
  useLibraryFolders,
  useLibraryItems,
  useLibraryTags,
} from "./hooks";
import { LibraryItemCard } from "./library-item-card";

const TYPE_OPTIONS = [
  { value: "image", label: "Images" },
  { value: "gif", label: "GIFs" },
  { value: "video", label: "Videos" },
  { value: "text", label: "Text snippets" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "title", label: "Title" },
  { value: "most_used", label: "Most used" },
];

export function LibraryPage() {
  const queryClient = useQueryClient();
  const [folder, setFolder] = useState<string>("");
  const [type, setType] = useState("");
  const [tag, setTag] = useState("");
  const [sort, setSort] = useState("newest");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<ContentItem | null>(null);
  const [snippetOpen, setSnippetOpen] = useState(false);
  const [uploading, setUploading] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedSearch = useDebounce(search);

  const filters = {
    page,
    folder_id: folder || undefined,
    kind: type === "text" ? "text" : type ? "media" : undefined,
    media_type: type && type !== "text" ? type : undefined,
    tag: tag || undefined,
    sort,
    search: debouncedSearch || undefined,
  };
  const items = useLibraryItems(filters);
  const folders = useLibraryFolders();
  const tags = useLibraryTags();
  const refresh = () => queryClient.invalidateQueries({ queryKey: libraryKeys.all });

  const upload = async (files: File[]) => {
    const folderId = folder && folder !== "root" ? Number(folder) : null;
    setUploading(files.length);
    for (const file of files) {
      try {
        await libraryService.upload(file, { folder_id: folderId });
      } catch (error) {
        toast.error(`${file.name}: ${errorMessage(error)}`);
      }
      setUploading((count) => count - 1);
    }
    void refresh();
  };

  const reset = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setPage(1);
  };

  return (
    <>
      <PageHeader
        title="Content library"
        description="Store images, videos and reusable text to drop into any post."
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setSnippetOpen(true)}>
              New snippet
            </Button>
            <Button onClick={() => inputRef.current?.click()} loading={uploading > 0}>
              Upload
            </Button>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept={MEDIA_ACCEPT}
              className="sr-only"
              aria-label="Upload to library"
              onChange={(event) => {
                void upload(Array.from(event.target.files ?? []));
                event.target.value = "";
              }}
            />
          </div>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[14rem_1fr]">
        <FolderSidebar
          folders={folders.data ?? []}
          active={folder}
          onSelect={reset(setFolder)}
          onChanged={refresh}
        />
        <div
          className="min-w-0"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            void upload(Array.from(event.dataTransfer.files));
          }}
        >
          <div className="mb-4 flex flex-wrap gap-2">
            <div className="min-w-48 flex-1">
              <Input
                type="search"
                aria-label="Search library"
                placeholder="Search titles and text…"
                value={search}
                onChange={(e) => reset(setSearch)(e.target.value)}
              />
            </div>
            <div className="w-36">
              <Select
                aria-label="Type"
                placeholder="All types"
                value={type}
                onChange={(e) => reset(setType)(e.target.value)}
                options={TYPE_OPTIONS}
              />
            </div>
            <div className="w-36">
              <Select
                aria-label="Tag"
                placeholder="All tags"
                value={tag}
                onChange={(e) => reset(setTag)(e.target.value)}
                options={(tags.data ?? []).map((t) => ({ value: t, label: `#${t}` }))}
              />
            </div>
            <div className="w-32">
              <Select
                aria-label="Sort"
                value={sort}
                onChange={(e) => reset(setSort)(e.target.value)}
                options={SORT_OPTIONS}
              />
            </div>
          </div>
          {uploading > 0 && (
            <p role="status" className="mb-3 flex items-center gap-2 text-sm text-slate-600">
              <Spinner className="text-brand-600 size-4" /> Uploading {uploading} file(s)…
            </p>
          )}
          {items.isLoading ? (
            <Loading />
          ) : items.error ? (
            <ErrorState error={items.error} onRetry={() => void items.refetch()} />
          ) : !items.data?.items.length ? (
            <EmptyState
              title="Nothing here yet"
              description="Upload files (or drop them here) or save a text snippet to reuse later."
            />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                {items.data.items.map((item) => (
                  <LibraryItemCard key={item.id} item={item} onSelect={() => setEditing(item)} />
                ))}
              </div>
              <div className="mt-4 rounded-xl border border-slate-200 bg-white">
                <Pagination meta={items.data.meta} onPageChange={setPage} />
              </div>
            </>
          )}
        </div>
      </div>

      <ItemModal
        item={editing}
        folders={folders.data ?? []}
        onClose={() => setEditing(null)}
        onChanged={refresh}
      />
      <SnippetModal
        open={snippetOpen}
        folders={folders.data ?? []}
        defaultFolder={folder}
        onClose={() => setSnippetOpen(false)}
        onSaved={refresh}
      />
    </>
  );
}

function FolderSidebar({
  folders,
  active,
  onSelect,
  onChanged,
}: {
  folders: ContentFolder[];
  active: string;
  onSelect: (id: string) => void;
  onChanged: () => void;
}) {
  const [name, setName] = useState("");
  const [deleting, setDeleting] = useState<ContentFolder | null>(null);
  const create = useMutation({
    mutationFn: () => libraryService.createFolder(name.trim()),
    onSuccess: () => {
      setName("");
      onChanged();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
  const remove = useMutation({
    mutationFn: (id: number) => libraryService.deleteFolder(id),
    onSuccess: ({ message }) => {
      toast.success(message);
      setDeleting(null);
      onSelect("");
      onChanged();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
  const entry = (id: string, label: string, count?: number) => (
    <button
      key={id || "all"}
      type="button"
      aria-current={active === id ? "true" : undefined}
      onClick={() => onSelect(id)}
      className={cn(
        "flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-left text-sm",
        active === id
          ? "bg-brand-50 text-brand-700 font-medium"
          : "text-slate-600 hover:bg-slate-100",
      )}
    >
      <span className="truncate">{label}</span>
      {count !== undefined && <span className="text-xs text-slate-400">{count}</span>}
    </button>
  );

  return (
    <nav aria-label="Folders" className="space-y-1">
      {entry("", "All items")}
      {entry("root", "Unfiled")}
      {folders.map((folder) => (
        <div key={folder.id} className="group flex items-center">
          {entry(String(folder.id), folder.name, folder.items_count)}
          <button
            type="button"
            aria-label={`Delete folder ${folder.name}`}
            onClick={() => setDeleting(folder)}
            className="ml-1 rounded px-1 text-xs text-slate-400 opacity-0 group-hover:opacity-100 hover:text-red-600 focus:opacity-100"
          >
            ✕
          </button>
        </div>
      ))}
      <form
        className="flex gap-1 pt-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (name.trim()) create.mutate();
        }}
      >
        <input
          aria-label="New folder name"
          placeholder="New folder"
          maxLength={100}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-8 min-w-0 flex-1 rounded-lg border border-slate-300 px-2 text-sm"
        />
        <Button type="submit" size="sm" variant="secondary" loading={create.isPending}>
          Add
        </Button>
      </form>
      <ConfirmDialog
        open={deleting !== null}
        title={`Delete folder “${deleting?.name ?? ""}”?`}
        description="The items inside are kept and moved up one level."
        confirmLabel="Delete folder"
        destructive
        loading={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
        onCancel={() => setDeleting(null)}
      />
    </nav>
  );
}

function folderOptions(folders: ContentFolder[]) {
  return folders.map((folder) => ({ value: String(folder.id), label: folder.name }));
}

function ItemModal({
  item,
  folders,
  onClose,
  onChanged,
}: {
  item: ContentItem | null;
  folders: ContentFolder[];
  onClose: () => void;
  onChanged: () => void;
}) {
  return (
    <Modal
      open={item !== null}
      onClose={onClose}
      title={item?.kind === "text" ? "Edit snippet" : "Library item"}
    >
      {item && (
        <ItemForm
          key={item.id}
          item={item}
          folders={folders}
          onClose={onClose}
          onChanged={onChanged}
        />
      )}
    </Modal>
  );
}

function ItemForm({
  item,
  folders,
  onClose,
  onChanged,
}: {
  item: ContentItem;
  folders: ContentFolder[];
  onClose: () => void;
  onChanged: () => void;
}) {
  const [title, setTitle] = useState(item.title);
  const [body, setBody] = useState(item.body ?? "");
  const [folderId, setFolderId] = useState(item.folder_id ? String(item.folder_id) : "");
  const [tags, setTags] = useState(item.tags.join(", "));
  const [confirming, setConfirming] = useState(false);

  const save = useMutation({
    mutationFn: () =>
      libraryService.update(item.id, {
        title,
        ...(item.kind === "text" ? { body } : {}),
        folder_id: folderId ? Number(folderId) : null,
        tags: parseTags(tags),
      }),
    onSuccess: ({ message }) => {
      toast.success(message);
      onChanged();
      onClose();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
  const remove = useMutation({
    mutationFn: () => libraryService.remove(item.id),
    onSuccess: ({ message }) => {
      toast.success(message);
      onChanged();
      onClose();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  return (
    <div className="space-y-4">
      {item.kind === "media" && item.url && (
        <div className="overflow-hidden rounded-lg bg-slate-100">
          {item.media_type === "video" ? (
            <video src={item.url} controls className="max-h-64 w-full" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element -- user uploads on the API host
            <img src={item.url} alt={item.title} className="max-h-64 w-full object-contain" />
          )}
        </div>
      )}
      <Input
        label="Title"
        value={title}
        maxLength={255}
        onChange={(e) => setTitle(e.target.value)}
      />
      {item.kind === "text" && (
        <div className="space-y-1">
          <label htmlFor="snippet-body" className="block text-sm font-medium text-slate-700">
            Text
          </label>
          <textarea
            id="snippet-body"
            rows={5}
            maxLength={10000}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      )}
      <Select
        label="Folder"
        placeholder="Unfiled"
        value={folderId}
        onChange={(e) => setFolderId(e.target.value)}
        options={folderOptions(folders)}
      />
      <Input
        label="Tags"
        hint="Separate with commas"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
      />
      <p className="text-xs text-slate-500">
        {item.kind === "media" && `${item.original_name} · ${formatBytes(item.size)} · `}Added{" "}
        {formatDate(item.created_at)} · used {item.usage_count} time(s)
      </p>
      <div className="flex flex-wrap justify-between gap-2">
        <div className="flex gap-2">
          {item.kind === "media" ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                void libraryService.download(item).catch((e) => toast.error(errorMessage(e)))
              }
            >
              Download
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                void navigator.clipboard
                  .writeText(body)
                  .then(() => toast.success("Copied to clipboard."))
              }
            >
              Copy text
            </Button>
          )}
          <Button variant="danger" size="sm" onClick={() => setConfirming(true)}>
            Delete
          </Button>
        </div>
        <Button size="sm" loading={save.isPending} onClick={() => save.mutate()}>
          Save
        </Button>
      </div>
      <ConfirmDialog
        open={confirming}
        title="Delete this item?"
        description="Posts that already use it keep their own copy."
        confirmLabel="Delete"
        destructive
        loading={remove.isPending}
        onConfirm={() => remove.mutate()}
        onCancel={() => setConfirming(false)}
      />
    </div>
  );
}

function SnippetModal({
  open,
  folders,
  defaultFolder,
  onClose,
  onSaved,
}: {
  open: boolean;
  folders: ContentFolder[];
  defaultFolder: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState("");
  const [folderId, setFolderId] = useState("");
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  // New snippets go to the chosen folder, else the folder currently being viewed.
  const targetFolder = folderId || (defaultFolder && defaultFolder !== "root" ? defaultFolder : "");
  const save = useMutation({
    mutationFn: () =>
      libraryService.createSnippet({
        title,
        body,
        tags: parseTags(tags),
        folder_id: targetFolder ? Number(targetFolder) : null,
      }),
    onSuccess: ({ message }) => {
      toast.success(message);
      setTitle("");
      setBody("");
      setTags("");
      setErrors({});
      onSaved();
      onClose();
    },
    onError: (error) => setErrors(toApiError(error).errors),
  });

  return (
    <Modal open={open} onClose={onClose} title="New text snippet">
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          save.mutate();
        }}
      >
        <Input
          label="Title"
          maxLength={255}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={errors.title?.[0]}
        />
        <div className="space-y-1">
          <label htmlFor="new-snippet-body" className="block text-sm font-medium text-slate-700">
            Text
          </label>
          <textarea
            id="new-snippet-body"
            rows={5}
            maxLength={10000}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          {errors.body && <p className="text-sm text-red-600">{errors.body[0]}</p>}
        </div>
        <Select
          label="Folder"
          placeholder="Unfiled"
          value={folderId}
          onChange={(e) => setFolderId(e.target.value)}
          options={folderOptions(folders)}
        />
        <Input
          label="Tags"
          hint="Separate with commas"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={save.isPending}>
            Save snippet
          </Button>
        </div>
      </form>
    </Modal>
  );
}

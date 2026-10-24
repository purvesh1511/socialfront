import { downloadFile } from "@/lib/download";
import type { ApiEnvelope } from "@/types/api";
import type { ContentFolder, ContentItem, LibraryFilters } from "@/types/insights";
import type { Media } from "@/types/social";
import { apiClient, get, getPaginated, send } from "./api-client";

export interface SnippetInput {
  title: string;
  body: string;
  folder_id?: number | null;
  tags?: string[];
}

export const libraryService = {
  items: (filters: LibraryFilters) => getPaginated<ContentItem>("/customer/library/items", filters),
  upload: async (file: File, meta: { folder_id?: number | null; tags?: string[] } = {}) => {
    const form = new FormData();
    form.append("file", file);
    if (meta.folder_id) form.append("folder_id", String(meta.folder_id));
    meta.tags?.forEach((tag) => form.append("tags[]", tag));
    const { data } = await apiClient.post<ApiEnvelope<ContentItem>>(
      "/customer/library/items/upload",
      form,
    );
    return data.data;
  },
  createSnippet: (input: SnippetInput) =>
    send<ContentItem>("post", "/customer/library/items/snippets", input),
  update: (id: number, input: Partial<SnippetInput>) =>
    send<ContentItem>("patch", `/customer/library/items/${id}`, input),
  remove: (id: number) => send<null>("delete", `/customer/library/items/${id}`),
  download: (item: ContentItem) =>
    downloadFile(`/customer/library/items/${item.id}/download`, item.original_name ?? item.title),
  /** Media → a post upload; text → the snippet (usage recorded). */
  use: (id: number) => send<Media | ContentItem>("post", `/customer/library/items/${id}/use`),
  folders: () => get<ContentFolder[]>("/customer/library/folders"),
  createFolder: (name: string, parentId?: number | null) =>
    send<ContentFolder>("post", "/customer/library/folders", { name, parent_id: parentId ?? null }),
  renameFolder: (id: number, name: string) =>
    send<ContentFolder>("patch", `/customer/library/folders/${id}`, { name }),
  deleteFolder: (id: number) => send<null>("delete", `/customer/library/folders/${id}`),
  tags: () => get<string[]>("/customer/library/tags"),
};

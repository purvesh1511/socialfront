"use client";

import { useQuery } from "@tanstack/react-query";
import { libraryService } from "@/services/library.service";
import type { LibraryFilters } from "@/types/insights";

export const libraryKeys = {
  all: ["library"] as const,
  items: (filters: LibraryFilters) => ["library", "items", filters] as const,
  folders: ["library", "folders"] as const,
  tags: ["library", "tags"] as const,
};

export function useLibraryItems(filters: LibraryFilters) {
  return useQuery({
    queryKey: libraryKeys.items(filters),
    queryFn: () => libraryService.items(filters),
  });
}

export function useLibraryFolders() {
  return useQuery({ queryKey: libraryKeys.folders, queryFn: libraryService.folders });
}

export function useLibraryTags() {
  return useQuery({ queryKey: libraryKeys.tags, queryFn: libraryService.tags });
}

/** "a, b , c" → ["a","b","c"] */
export function parseTags(value: string): string[] {
  return Array.from(
    new Set(
      value
        .split(",")
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean),
    ),
  );
}

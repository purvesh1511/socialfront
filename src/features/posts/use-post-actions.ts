"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { errorMessage } from "@/lib/api-error";
import { postsService } from "@/services/posts.service";
import { toast } from "@/stores/toast.store";
import type { Post } from "@/types/social";

type Action = "publish" | "queue" | "unschedule" | "cancel" | "duplicate" | "remove";

/**
 * Shared mutations for post row/detail actions. Invalidates post lists, calendar and queue.
 */
export function usePostActions(onDone?: (action: Action, post: Post | null) => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ action, id }: { action: Action; id: number }) => {
      const result = await postsService[action](id);
      return { action, ...result };
    },
    onSuccess: ({ action, data, message }) => {
      toast.success(message);
      void queryClient.invalidateQueries({ queryKey: ["posts"] });
      void queryClient.invalidateQueries({ queryKey: ["calendar"] });
      void queryClient.invalidateQueries({ queryKey: ["queue"] });
      onDone?.(action, data);
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
}

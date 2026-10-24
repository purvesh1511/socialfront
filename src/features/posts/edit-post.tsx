"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { EmptyState, ErrorState, Loading } from "@/components/ui";
import { ROUTES } from "@/constants/routes";
import { postsService } from "@/services/posts.service";
import { Composer } from "./composer/composer";

export function EditPost({ id }: { id: number }) {
  const post = useQuery({
    queryKey: ["posts", "detail", id],
    queryFn: () => postsService.show(id),
  });

  if (post.isLoading) return <Loading />;
  if (post.error || !post.data)
    return <ErrorState error={post.error} onRetry={() => void post.refetch()} />;
  if (!post.data.is_editable) {
    return (
      <EmptyState
        title="This post can no longer be edited"
        description="Published or publishing posts are read-only. Duplicate it to reuse the content."
        action={
          <Link
            href={ROUTES.posts.detail(id)}
            className="text-brand-600 hover:text-brand-700 text-sm font-medium"
          >
            View post →
          </Link>
        }
      />
    );
  }

  return <Composer post={post.data} />;
}

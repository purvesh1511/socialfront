"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageHeader } from "@/components/layouts/page-header";
import {
  Card,
  ConfirmDialog,
  Dropdown,
  EmptyState,
  ErrorState,
  Input,
  Loading,
  Pagination,
  Select,
} from "@/components/ui";
import { ROUTES } from "@/constants/routes";
import { useCurrentUser } from "@/features/auth/hooks";
import { useSocialAccounts } from "@/features/social-accounts/hooks";
import { AccountAvatar } from "@/features/social-accounts/account-avatar";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/format";
import { postsService } from "@/services/posts.service";
import type { Media, Post, PostStatus } from "@/types/social";
import { PostStatusBadge } from "./post-status-badge";
import { usePostActions } from "./use-post-actions";

export type PostsTab = "all" | "drafts" | "pending" | "scheduled" | "published" | "failed";

const TABS: {
  key: PostsTab;
  label: string;
  href: string;
  status?: string;
  sort: string;
  direction: "asc" | "desc";
}[] = [
  { key: "all", label: "All", href: ROUTES.customer.posts, sort: "updated_at", direction: "desc" },
  {
    key: "drafts",
    label: "Drafts",
    href: ROUTES.posts.drafts,
    status: "draft,cancelled",
    sort: "updated_at",
    direction: "desc",
  },
  {
    key: "pending",
    label: "Pending approval",
    href: ROUTES.posts.pendingApproval,
    status: "pending_approval,approved",
    sort: "updated_at",
    direction: "desc",
  },
  {
    key: "scheduled",
    label: "Scheduled",
    href: ROUTES.posts.scheduled,
    status: "scheduled,publishing",
    sort: "scheduled_at",
    direction: "asc",
  },
  {
    key: "published",
    label: "Published",
    href: ROUTES.posts.published,
    status: "published",
    sort: "published_at",
    direction: "desc",
  },
  {
    key: "failed",
    label: "Failed",
    href: ROUTES.posts.failed,
    status: "failed",
    sort: "updated_at",
    direction: "desc",
  },
];

export function PostsList({ tab }: { tab: PostsTab }) {
  const config = TABS.find((item) => item.key === tab) ?? TABS[0];
  const accounts = useSocialAccounts();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [accountId, setAccountId] = useState("");
  const debouncedSearch = useDebounce(search);

  const filters = {
    page,
    status: config.status,
    sort: config.sort,
    direction: config.direction,
    search: debouncedSearch || undefined,
    account_id: accountId ? Number(accountId) : undefined,
  };
  const posts = useQuery({
    queryKey: ["posts", "list", filters],
    queryFn: () => postsService.list(filters),
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <PageHeader
        title="Posts"
        actions={
          <Link
            href={ROUTES.posts.create}
            className="bg-brand-600 hover:bg-brand-700 rounded-lg px-4 py-2 text-sm font-medium text-white"
          >
            Create post
          </Link>
        }
      />
      <nav
        aria-label="Post status"
        className="mb-4 flex gap-1 overflow-x-auto border-b border-slate-200"
      >
        {TABS.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            aria-current={item.key === tab ? "page" : undefined}
            className={cn(
              "border-b-2 px-3 py-2 text-sm font-medium whitespace-nowrap",
              item.key === tab
                ? "border-brand-600 text-brand-700"
                : "border-transparent text-slate-500 hover:text-slate-700",
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <Card bodyClassName="p-0">
        <div className="flex flex-wrap gap-3 border-b border-slate-100 p-4">
          <div className="min-w-60 flex-1">
            <Input
              type="search"
              aria-label="Search posts"
              placeholder="Search text…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="w-56">
            <Select
              aria-label="Filter by account"
              placeholder="All accounts"
              value={accountId}
              onChange={(e) => {
                setAccountId(e.target.value);
                setPage(1);
              }}
              options={(accounts.data ?? []).map((account) => ({
                value: String(account.id),
                label: `${account.name} (${account.platform.name})`,
              }))}
            />
          </div>
        </div>
        {posts.isLoading ? (
          <Loading />
        ) : posts.error ? (
          <ErrorState error={posts.error} onRetry={() => void posts.refetch()} />
        ) : !posts.data?.items.length ? (
          <EmptyState
            title="No posts here yet"
            action={
              <Link
                href={ROUTES.posts.create}
                className="text-brand-600 hover:text-brand-700 text-sm font-medium"
              >
                Create a post →
              </Link>
            }
          />
        ) : (
          <ul className="divide-y divide-slate-100">
            {posts.data.items.map((post) => (
              <PostRow key={post.id} post={post} />
            ))}
          </ul>
        )}
        <Pagination meta={posts.data?.meta} onPageChange={setPage} />
      </Card>
    </>
  );
}

function PostRow({ post }: { post: Post }) {
  const router = useRouter();
  const actions = usePostActions((action, data) => {
    if (action === "duplicate" && data) router.push(ROUTES.posts.edit(data.id));
  });
  const [deleting, setDeleting] = useState(false);
  const { data: me } = useCurrentUser();
  const when = post.published_at ?? post.scheduled_at;
  // Customers whose posts need approval publish through the approval flow on the post page.
  const can = (...statuses: PostStatus[]) =>
    !me?.requires_post_approval && statuses.includes(post.status);

  return (
    <li className="flex flex-wrap items-center gap-4 px-5 py-4">
      {post.media[0] && <MediaThumb media={post.media[0]} />}
      <Link href={ROUTES.posts.detail(post.id)} className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm text-slate-800">
          {post.content || <span className="text-slate-400 italic">No text</span>}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          {post.status === "published"
            ? "Published"
            : post.scheduled_at
              ? post.is_queued
                ? "Queued for"
                : "Scheduled for"
              : "Updated"}{" "}
          {formatDateTime(when ?? post.updated_at)}
        </p>
      </Link>
      <div className="flex -space-x-1">
        {post.targets.slice(0, 5).map((target) => (
          <AccountAvatar key={target.id} account={target.account} size="sm" />
        ))}
      </div>
      <PostStatusBadge status={post.status} />
      <Dropdown
        label="Post actions"
        trigger={<span aria-hidden="true">⋯</span>}
        items={[
          ...(post.is_editable
            ? [{ label: "Edit", onSelect: () => router.push(ROUTES.posts.edit(post.id)) }]
            : []),
          {
            label: "Duplicate",
            onSelect: () => actions.mutate({ action: "duplicate", id: post.id }),
          },
          ...(can("draft", "scheduled", "failed")
            ? [
                {
                  label: post.status === "failed" ? "Retry now" : "Publish now",
                  onSelect: () => actions.mutate({ action: "publish", id: post.id }),
                },
              ]
            : []),
          ...(can("draft", "failed")
            ? [
                {
                  label: "Add to queue",
                  onSelect: () => actions.mutate({ action: "queue", id: post.id }),
                },
              ]
            : []),
          ...(can("scheduled")
            ? [
                {
                  label: "Move to drafts",
                  onSelect: () => actions.mutate({ action: "unschedule", id: post.id }),
                },
              ]
            : []),
          ...(post.status !== "publishing"
            ? [{ label: "Delete", destructive: true, onSelect: () => setDeleting(true) }]
            : []),
        ]}
      />
      <ConfirmDialog
        open={deleting}
        title="Delete post?"
        description="This removes the post from your calendar and queue. Posts already published on networks are not removed there."
        confirmLabel="Delete"
        destructive
        loading={actions.isPending}
        onConfirm={() =>
          actions.mutate({ action: "remove", id: post.id }, { onSuccess: () => setDeleting(false) })
        }
        onCancel={() => setDeleting(false)}
      />
    </li>
  );
}

function MediaThumb({ media }: { media: Media }) {
  if (media.type === "video") {
    return <video src={media.url} className="size-12 rounded object-cover" muted />;
  }

  // eslint-disable-next-line @next/next/no-img-element -- user uploads on the API host
  return <img src={media.url} alt="" className="size-12 rounded object-cover" />;
}

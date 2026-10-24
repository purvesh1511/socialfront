"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageHeader } from "@/components/layouts/page-header";
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  ErrorState,
  Input,
  Loading,
  Modal,
} from "@/components/ui";
import { POST_STATUS_LABELS } from "@/constants/social";
import { ROUTES } from "@/constants/routes";
import { ApprovalPanel } from "@/features/approvals/approval-panel";
import { SubmitForApprovalModal } from "@/features/approvals/submit-for-approval-modal";
import { useCurrentUser } from "@/features/auth/hooks";
import { AccountAvatar } from "@/features/social-accounts/account-avatar";
import { errorMessage } from "@/lib/api-error";
import { approvalsService } from "@/services/approvals.service";
import { toast } from "@/stores/toast.store";
import { formatDateTime } from "@/lib/format";
import { postsService } from "@/services/posts.service";
import type { ApprovalAction, Post, PostTarget } from "@/types/social";
import { RichText } from "./composer/rich-text";
import { PostStatusBadge } from "./post-status-badge";
import { usePostActions } from "./use-post-actions";

const PUBLISHING_POLL_MS = 3000;

export function PostDetail({ id }: { id: number }) {
  const post = useQuery({
    queryKey: ["posts", "detail", id],
    queryFn: () => postsService.show(id),
    refetchInterval: (query) =>
      query.state.data?.status === "publishing" ? PUBLISHING_POLL_MS : false,
  });

  if (post.isLoading) return <Loading />;
  if (post.error || !post.data)
    return <ErrorState error={post.error} onRetry={() => void post.refetch()} />;

  return <PostDetailView post={post.data} />;
}

function PostDetailView({ post }: { post: Post }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const actions = usePostActions((action, data) => {
    if (action === "remove") router.replace(ROUTES.customer.posts);
    if (action === "duplicate" && data) router.push(ROUTES.posts.edit(data.id));
  });
  const queryClient = useQueryClient();
  const { data: me } = useCurrentUser();
  const needsApproval = Boolean(me?.requires_post_approval);
  const [submitting, setSubmitting] = useState(false);
  const submitForApproval = useMutation({
    mutationFn: ({ action, at }: { action: ApprovalAction; at: string | null }) =>
      approvalsService.submit(post.id, action, at),
    onSuccess: ({ message }) => {
      toast.success(message);
      setSubmitting(false);
      void queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
  const issues = Object.values(post.issues ?? {}).flat();
  const run = (action: "publish" | "queue" | "unschedule" | "cancel" | "duplicate") =>
    actions.mutate({ action, id: post.id });

  return (
    <>
      <PageHeader
        title={`Post #${post.id}`}
        description={
          post.published_at
            ? `Published ${formatDateTime(post.published_at)}`
            : post.scheduled_at
              ? `${post.is_queued ? "Queued" : "Scheduled"} for ${formatDateTime(post.scheduled_at)}`
              : `Last updated ${formatDateTime(post.updated_at)}`
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <PostStatusBadge status={post.status} />
            {post.is_editable && (
              <Link
                href={ROUTES.posts.edit(post.id)}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50"
              >
                Edit
              </Link>
            )}
            {needsApproval && post.is_editable && (
              <Button size="sm" onClick={() => setSubmitting(true)}>
                Submit for approval
              </Button>
            )}
            {!needsApproval && ["draft", "scheduled", "failed"].includes(post.status) && (
              <Button size="sm" onClick={() => run("publish")} loading={actions.isPending}>
                {post.status === "failed" ? "Retry now" : "Publish now"}
              </Button>
            )}
            {post.status === "scheduled" && (
              <Button size="sm" variant="secondary" onClick={() => run("unschedule")}>
                Move to drafts
              </Button>
            )}
            <Button size="sm" variant="secondary" onClick={() => run("duplicate")}>
              Duplicate
            </Button>
            {post.status !== "publishing" && (
              <Button size="sm" variant="danger" onClick={() => setDeleting(true)}>
                Delete
              </Button>
            )}
          </div>
        }
      />

      {issues.length > 0 && post.is_editable && (
        <div
          role="alert"
          className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
          <p className="font-medium">Fix these before scheduling or publishing:</p>
          <ul className="mt-1 list-disc pl-5">
            {issues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {post.approval && <ApprovalPanel approval={post.approval} postId={post.id} />}
          <Card title="Content">
            {post.content ? (
              <RichText text={post.content} />
            ) : (
              <p className="text-sm text-slate-400 italic">No text</p>
            )}
            {post.link_url && (
              <a
                href={post.link_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-600 mt-3 block text-sm hover:underline"
              >
                {post.link_url}
              </a>
            )}
            {post.media.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-2">
                {post.media.map((media) =>
                  media.type === "video" ? (
                    <video
                      key={media.id}
                      src={media.url}
                      controls
                      className="aspect-square w-full rounded-lg bg-black object-cover"
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element -- user uploads on the API host
                    <img
                      key={media.id}
                      src={media.url}
                      alt=""
                      className="aspect-square w-full rounded-lg object-cover"
                    />
                  ),
                )}
              </div>
            )}
          </Card>
          <Card title="Accounts" bodyClassName="p-0">
            <ul className="divide-y divide-slate-100">
              {post.targets.map((target) => (
                <TargetRow key={target.id} postId={post.id} target={target} />
              ))}
            </ul>
          </Card>
        </div>
        <Card title="History">
          <ol className="space-y-3 text-sm">
            {post.history?.map((entry) => (
              <li key={entry.id} className="border-l-2 border-slate-200 pl-3">
                <p className="font-medium text-slate-800">
                  {entry.from_status ? `${POST_STATUS_LABELS[entry.from_status]} → ` : ""}
                  {POST_STATUS_LABELS[entry.to_status]}
                </p>
                {entry.note && <p className="text-slate-600">{entry.note}</p>}
                <p className="text-xs text-slate-400">
                  {formatDateTime(entry.created_at)}
                  {entry.user ? ` · ${entry.user}` : " · system"}
                </p>
              </li>
            ))}
          </ol>
        </Card>
      </div>

      <SubmitForApprovalModal
        open={submitting}
        loading={submitForApproval.isPending}
        initialScheduledAt={post.scheduled_at}
        onClose={() => setSubmitting(false)}
        onSubmit={(action, at) => submitForApproval.mutate({ action, at })}
      />
      <ConfirmDialog
        open={deleting}
        title="Delete post?"
        description="This removes the post from your calendar and queue. Posts already published on networks are not removed there."
        confirmLabel="Delete"
        destructive
        loading={actions.isPending}
        onConfirm={() => actions.mutate({ action: "remove", id: post.id })}
        onCancel={() => setDeleting(false)}
      />
    </>
  );
}

const TARGET_STATUS = {
  pending: { tone: "neutral", label: "Pending" },
  publishing: { tone: "warning", label: "Publishing" },
  retrying: { tone: "warning", label: "Retry scheduled" },
  published: { tone: "success", label: "Published" },
  failed: { tone: "danger", label: "Failed" },
  auth_required: { tone: "danger", label: "Reconnect required" },
  unknown_result: { tone: "warning", label: "Result unknown" },
} as const satisfies Record<PostTarget["status"], { tone: string; label: string }>;

function TargetRow({ postId, target }: { postId: number; target: PostTarget }) {
  const [showLogs, setShowLogs] = useState(false);
  const [confirmingPublished, setConfirmingPublished] = useState(false);
  const [postUrl, setPostUrl] = useState("");
  const queryClient = useQueryClient();
  const resolve = useMutation({
    mutationFn: (published: boolean) =>
      postsService.resolveTarget(postId, target.id, published, postUrl),
    onSuccess: ({ message }) => {
      toast.success(message);
      setConfirmingPublished(false);
      void queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
  const status = TARGET_STATUS[target.status];

  return (
    <li className="px-5 py-4">
      <div className="flex flex-wrap items-center gap-3">
        <AccountAvatar account={target.account} />
        <div className="min-w-0 flex-1">
          <p className="font-medium text-slate-900">{target.account.name}</p>
          <p className="text-xs text-slate-500">
            {target.account.platform.name}
            {target.published_at && ` · published ${formatDateTime(target.published_at)}`}
            {target.status === "retrying" &&
              target.next_retry_at &&
              ` · attempt ${target.attempts} failed, retrying ${formatDateTime(target.next_retry_at)}`}
          </p>
        </div>
        <Badge tone={status.tone}>{status.label}</Badge>
        {target.platform_post_url && (
          <a
            href={target.platform_post_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-600 text-sm font-medium hover:underline"
          >
            View post ↗
          </a>
        )}
      </div>
      {target.content && (
        <p className="mt-2 rounded bg-slate-50 p-2 text-xs text-slate-600">
          Custom text: {target.content}
        </p>
      )}
      {target.error_message && <p className="mt-2 text-sm text-red-600">{target.error_message}</p>}
      {target.status === "unknown_result" && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-sm text-slate-600">
            Check {target.account.name} on {target.account.platform.name}, then confirm:
          </span>
          <Button size="sm" variant="secondary" onClick={() => setConfirmingPublished(true)}>
            It was published
          </Button>
          <Button
            size="sm"
            variant="secondary"
            loading={resolve.isPending && resolve.variables === false}
            onClick={() => resolve.mutate(false)}
          >
            It was not published
          </Button>
        </div>
      )}
      <Modal
        open={confirmingPublished}
        onClose={() => setConfirmingPublished(false)}
        title="Confirm it was published"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmingPublished(false)}>
              Cancel
            </Button>
            <Button loading={resolve.isPending} onClick={() => resolve.mutate(true)}>
              Confirm
            </Button>
          </>
        }
      >
        <Input
          label="Post URL (optional)"
          type="url"
          placeholder="https://"
          value={postUrl}
          onChange={(event) => setPostUrl(event.target.value)}
        />
      </Modal>
      {(target.publish_logs?.length ?? 0) > 0 && (
        <div className="mt-2">
          <button
            type="button"
            className="text-xs font-medium text-slate-500 hover:text-slate-700"
            onClick={() => setShowLogs((v) => !v)}
            aria-expanded={showLogs}
          >
            {showLogs ? "Hide" : "Show"} publish log ({target.publish_logs?.length})
          </button>
          {showLogs && (
            <ul className="mt-2 space-y-1 text-xs">
              {target.publish_logs?.map((log) => (
                <li key={log.id} className="flex gap-2">
                  <span
                    className={
                      log.status === "success"
                        ? "text-emerald-700"
                        : log.status === "unknown"
                          ? "text-amber-700"
                          : "text-red-700"
                    }
                  >
                    #{log.attempt} {log.status}
                  </span>
                  <span className="text-slate-400">{formatDateTime(log.created_at)}</span>
                  <span className="text-slate-600">
                    {log.error_message ?? log.platform_post_id}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </li>
  );
}

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/components/layouts/page-header";
import { Badge, Button, Card, ErrorState, Loading } from "@/components/ui";
import { APPROVAL_ACTION_LABELS } from "@/constants/social";
import { APPROVAL_TONES } from "@/features/approvals/approval-panel";
import { ApprovalThread } from "@/features/approvals/approval-thread";
import { PostPreview } from "@/features/posts/composer/post-preview";
import { toApiError } from "@/lib/api-error";
import { formatDateTime, humanize } from "@/lib/format";
import { approvalsService } from "@/services/approvals.service";
import { toast } from "@/stores/toast.store";
import type { Approval } from "@/types/social";

export function ApprovalReview({ id }: { id: number }) {
  const approval = useQuery({
    queryKey: ["admin", "approvals", id],
    queryFn: () => approvalsService.show(id),
  });

  if (approval.isLoading) return <Loading />;
  if (approval.error || !approval.data)
    return <ErrorState error={approval.error} onRetry={() => void approval.refetch()} />;

  return <ReviewView approval={approval.data} />;
}

function ReviewView({ approval }: { approval: Approval }) {
  const queryClient = useQueryClient();
  const [note, setNote] = useState("");
  const [noteError, setNoteError] = useState<string | null>(null);
  const post = approval.post;
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin", "approvals"] });

  const decide = useMutation({
    mutationFn: (decision: "approve" | "reject") =>
      decision === "approve"
        ? approvalsService.approve(approval.id, note)
        : approvalsService.reject(approval.id, note),
    onSuccess: ({ message }) => {
      toast.success(message);
      setNote("");
      void refresh();
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error) => {
      const apiError = toApiError(error);
      setNoteError(apiError.errors.note?.[0] ?? null);
      toast.error(apiError.message);
    },
  });

  const issues = Object.values(approval.post_issues ?? {}).flat();

  return (
    <>
      <PageHeader
        title={`Approval request #${approval.id}`}
        description={`Submitted by ${approval.requester?.name} (${approval.requester?.email}) · ${formatDateTime(approval.created_at)}`}
        actions={<Badge tone={APPROVAL_TONES[approval.status]}>{approval.status}</Badge>}
      />
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <Card title="Preview" description={`${post?.targets.length ?? 0} account(s)`}>
            <div className="grid gap-4 sm:grid-cols-2">
              {post?.targets.map((target) => (
                <PostPreview
                  key={target.id}
                  account={target.account}
                  text={target.content || post.content || ""}
                  media={post.media}
                  linkUrl={post.link_url ?? ""}
                  title={target.options?.title}
                />
              ))}
            </div>
          </Card>
          <Card title="Discussion">
            <ApprovalThread
              comments={approval.comments ?? []}
              onComment={
                approval.status === "pending"
                  ? (body) => approvalsService.adminComment(approval.id, body).then(() => refresh())
                  : undefined
              }
            />
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <Card title="Request">
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-slate-500">When approved</dt>
                <dd className="font-medium text-slate-800">
                  {APPROVAL_ACTION_LABELS[approval.requested_action]}
                  {approval.requested_scheduled_at &&
                    ` · ${formatDateTime(approval.requested_scheduled_at)}`}
                </dd>
              </div>
              {approval.reviewer && (
                <div>
                  <dt className="text-slate-500">Decision</dt>
                  <dd className="font-medium text-slate-800">
                    {approval.status} by {approval.reviewer.name} ·{" "}
                    {formatDateTime(approval.reviewed_at)}
                  </dd>
                  {approval.decision_note && (
                    <dd className="mt-1 text-slate-600">{approval.decision_note}</dd>
                  )}
                </div>
              )}
            </dl>
          </Card>

          {approval.status === "pending" && (
            <Card title="Decision">
              {issues.length > 0 && (
                <div
                  role="alert"
                  className="mb-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900"
                >
                  This post can&apos;t be published as-is:
                  <ul className="mt-1 list-disc pl-5">
                    {issues.map((issue) => (
                      <li key={issue}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}
              <label
                htmlFor="decision-note"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Note to the customer{" "}
                <span className="font-normal text-slate-400">(required to reject)</span>
              </label>
              <textarea
                id="decision-note"
                rows={3}
                maxLength={2000}
                value={note}
                aria-invalid={noteError ? true : undefined}
                onChange={(event) => {
                  setNote(event.target.value);
                  setNoteError(null);
                }}
                className="focus:border-brand-500 focus:ring-brand-100 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:outline-none"
              />
              {noteError && <p className="mt-1 text-sm text-red-600">{noteError}</p>}
              <div className="mt-3 flex gap-2">
                <Button
                  loading={decide.isPending && decide.variables === "approve"}
                  disabled={decide.isPending || issues.length > 0}
                  onClick={() => decide.mutate("approve")}
                >
                  Approve
                </Button>
                <Button
                  variant="danger"
                  loading={decide.isPending && decide.variables === "reject"}
                  disabled={decide.isPending}
                  onClick={() => decide.mutate("reject")}
                >
                  Reject
                </Button>
              </div>
            </Card>
          )}

          <Card title="History">
            <ol className="space-y-2 text-sm">
              {approval.history?.map((entry) => (
                <li key={entry.id} className="border-l-2 border-slate-200 pl-3">
                  <span className="font-medium text-slate-800">{humanize(entry.action)}</span>
                  <span className="text-slate-500">
                    {" "}
                    · {entry.user ?? "system"} · {formatDateTime(entry.created_at)}
                  </span>
                  {entry.note && <p className="text-slate-600">{entry.note}</p>}
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </>
  );
}

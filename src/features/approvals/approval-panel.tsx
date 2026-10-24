"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge, Button, Card } from "@/components/ui";
import { APPROVAL_ACTION_LABELS } from "@/constants/social";
import { errorMessage } from "@/lib/api-error";
import { formatDateTime } from "@/lib/format";
import { approvalsService } from "@/services/approvals.service";
import { toast } from "@/stores/toast.store";
import type { Approval } from "@/types/social";
import { ApprovalThread } from "./approval-thread";

export const APPROVAL_TONES = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
  withdrawn: "neutral",
} as const;

/** Customer view of the latest approval request on a post. */
export function ApprovalPanel({ approval, postId }: { approval: Approval; postId: number }) {
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["posts"] });
  const withdraw = useMutation({
    mutationFn: () => approvalsService.withdraw(postId),
    onSuccess: ({ message }) => {
      toast.success(message);
      void refresh();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  return (
    <Card
      title="Approval"
      actions={<Badge tone={APPROVAL_TONES[approval.status]}>{approval.status}</Badge>}
    >
      <dl className="mb-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-slate-500">When approved</dt>
          <dd className="font-medium text-slate-800">
            {APPROVAL_ACTION_LABELS[approval.requested_action]}
            {approval.requested_scheduled_at &&
              ` (${formatDateTime(approval.requested_scheduled_at)})`}
          </dd>
        </div>
        {approval.reviewer && (
          <div>
            <dt className="text-slate-500">Reviewed by</dt>
            <dd className="font-medium text-slate-800">
              {approval.reviewer.name} · {formatDateTime(approval.reviewed_at)}
            </dd>
          </div>
        )}
      </dl>
      {approval.decision_note && (
        <p
          className={`mb-4 rounded-lg p-3 text-sm ${approval.status === "rejected" ? "bg-red-50 text-red-800" : "bg-emerald-50 text-emerald-800"}`}
        >
          {approval.decision_note}
        </p>
      )}
      <ApprovalThread
        comments={approval.comments ?? []}
        onComment={
          approval.status === "pending"
            ? (body) =>
                approvalsService
                  .customerComment(approval.id, body)
                  .then(() => refresh())
                  .catch((error) => toast.error(errorMessage(error)))
            : undefined
        }
      />
      {approval.status === "pending" && (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <Button
            size="sm"
            variant="secondary"
            loading={withdraw.isPending}
            onClick={() => withdraw.mutate()}
          >
            Withdraw and edit
          </Button>
        </div>
      )}
    </Card>
  );
}

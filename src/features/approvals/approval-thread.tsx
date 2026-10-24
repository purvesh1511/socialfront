"use client";

import { useState } from "react";
import { Badge, Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/format";
import type { ApprovalComment } from "@/types/social";

interface ApprovalThreadProps {
  comments: ApprovalComment[];
  onComment?: (body: string) => Promise<unknown>;
}

/** Discussion between the customer and reviewers on an approval request. */
export function ApprovalThread({ comments, onComment }: ApprovalThreadProps) {
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  return (
    <div className="space-y-3">
      {comments.length === 0 ? (
        <p className="text-sm text-slate-500">No comments yet.</p>
      ) : (
        <ul className="space-y-3">
          {comments.map((comment) => (
            <li
              key={comment.id}
              className={cn(
                "rounded-lg p-3 text-sm",
                comment.is_staff ? "bg-brand-50" : "bg-slate-50",
              )}
            >
              <div className="mb-1 flex items-center gap-2 text-xs text-slate-500">
                <span className="font-semibold text-slate-700">{comment.user ?? "Unknown"}</span>
                {comment.is_staff && <Badge tone="brand">Reviewer</Badge>}
                <span>{formatDateTime(comment.created_at)}</span>
              </div>
              <p className="whitespace-pre-wrap text-slate-800">{comment.body}</p>
            </li>
          ))}
        </ul>
      )}
      {onComment && (
        <form
          className="space-y-2"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!body.trim()) return;
            setSending(true);
            try {
              await onComment(body.trim());
              setBody("");
            } finally {
              setSending(false);
            }
          }}
        >
          <label htmlFor="approval-comment" className="sr-only">
            Add a comment
          </label>
          <textarea
            id="approval-comment"
            rows={2}
            maxLength={2000}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Add a comment…"
            className="focus:border-brand-500 focus:ring-brand-100 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:outline-none"
          />
          <Button
            type="submit"
            size="sm"
            variant="secondary"
            loading={sending}
            disabled={!body.trim()}
          >
            Comment
          </Button>
        </form>
      )}
    </div>
  );
}

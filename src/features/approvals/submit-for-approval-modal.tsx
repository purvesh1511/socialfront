"use client";

import { useState } from "react";
import { Button, Input, Modal } from "@/components/ui";
import { APPROVAL_ACTION_LABELS } from "@/constants/social";
import { isoToLocalInput, localInputToIso } from "@/lib/calendar";
import type { ApprovalAction } from "@/types/social";

interface SubmitForApprovalModalProps {
  open: boolean;
  loading?: boolean;
  initialScheduledAt?: string | null;
  onClose: () => void;
  onSubmit: (action: ApprovalAction, scheduledAt: string | null) => void;
}

/** Lets the customer choose what should happen once a reviewer approves the post. */
export function SubmitForApprovalModal({
  open,
  loading,
  initialScheduledAt,
  onClose,
  onSubmit,
}: SubmitForApprovalModalProps) {
  const [action, setAction] = useState<ApprovalAction>(initialScheduledAt ? "schedule" : "queue");
  const [scheduledAt, setScheduledAt] = useState(isoToLocalInput(initialScheduledAt ?? null));
  const [error, setError] = useState<string | null>(null);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Submit for approval"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            loading={loading}
            onClick={() => {
              if (action === "schedule" && !scheduledAt) {
                setError("Choose when to publish.");
                return;
              }
              onSubmit(action, action === "schedule" ? localInputToIso(scheduledAt) : null);
            }}
          >
            Submit
          </Button>
        </>
      }
    >
      <fieldset className="space-y-3">
        <legend className="mb-2 text-sm text-slate-600">
          A reviewer will check your post. Once approved:
        </legend>
        {(Object.keys(APPROVAL_ACTION_LABELS) as ApprovalAction[]).map((option) => (
          <label key={option} className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="radio"
              name="approval-action"
              value={option}
              checked={action === option}
              onChange={() => setAction(option)}
              className="accent-brand-600"
            />
            {APPROVAL_ACTION_LABELS[option]}
          </label>
        ))}
        {action === "schedule" && (
          <Input
            label="Publish at"
            type="datetime-local"
            value={scheduledAt}
            error={error ?? undefined}
            onChange={(event) => {
              setScheduledAt(event.target.value);
              setError(null);
            }}
          />
        )}
      </fieldset>
    </Modal>
  );
}

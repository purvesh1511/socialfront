"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/components/layouts/page-header";
import { Badge, Button, Card, Modal, Select, Table, Textarea } from "@/components/ui";
import { ROUTES } from "@/constants/routes";
import { PLATFORM_STATUS_TONES } from "@/features/social-accounts/platform-status";
import { errorMessage } from "@/lib/api-error";
import { formatDate, humanize } from "@/lib/format";
import { systemService } from "@/services/system.service";
import { toast } from "@/stores/toast.store";
import type { PlatformSetting, PlatformUpdate } from "@/types/system";

type AssignableStatus = NonNullable<PlatformUpdate["verification_status"]>;

const STATUS_OPTIONS: { value: AssignableStatus; label: string }[] = [
  { value: "verified", label: "Verified — live test post succeeded" },
  { value: "limited", label: "Limited — verified for some media or account types" },
  { value: "implemented_pending_credentials", label: "Pending credentials or live test" },
  { value: "approval_required", label: "Provider approval required" },
  { value: "unsupported", label: "Unsupported" },
];

export function PlatformsManager() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<PlatformSetting | null>(null);
  const platforms = useQuery({
    queryKey: ["superadmin", "platforms"],
    queryFn: systemService.platforms,
  });
  const update = useMutation({
    mutationFn: ({ key, data }: { key: string; data: PlatformUpdate }) =>
      systemService.updatePlatform(key, data),
    onSuccess: ({ message }) => {
      toast.success(message);
      setEditing(null);
      void queryClient.invalidateQueries({ queryKey: ["superadmin", "platforms"] });
      void queryClient.invalidateQueries({ queryKey: ["platforms"] });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  return (
    <>
      <PageHeader
        title="Social platforms"
        description="Choose which networks customers can connect and record live-test evidence. Only verified or limited networks receive automated posts. API credentials are managed in Settings → Platforms."
        actions={
          <Link
            href={`${ROUTES.admin.settings}?group=platforms`}
            className="text-brand-600 hover:text-brand-700 text-sm font-medium"
          >
            Edit credentials →
          </Link>
        }
      />
      <Card bodyClassName="p-0">
        <Table
          rows={platforms.data}
          rowKey={(row) => row.key}
          isLoading={platforms.isLoading}
          error={platforms.error}
          onRetry={() => void platforms.refetch()}
          columns={[
            {
              key: "name",
              header: "Platform",
              cell: (row) => (
                <div>
                  <span className="font-medium text-slate-900">{row.name}</span>
                  {row.docs_url && (
                    <a
                      href={row.docs_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-600 block text-xs hover:underline"
                    >
                      API docs ↗
                    </a>
                  )}
                </div>
              ),
            },
            { key: "auth", header: "Connection", cell: (row) => humanize(row.auth_type) },
            {
              key: "configured",
              header: "Credentials",
              cell: (row) =>
                row.is_configured ? (
                  <Badge tone="success">Configured</Badge>
                ) : (
                  <Badge tone="warning">Missing</Badge>
                ),
            },
            {
              key: "verification",
              header: "Verification",
              cell: (row) => (
                <div className="space-y-0.5">
                  <Badge tone={PLATFORM_STATUS_TONES[row.status]}>{row.status_label}</Badge>
                  {row.verified_at && (
                    <p className="text-xs text-slate-500">Tested {formatDate(row.verified_at)}</p>
                  )}
                </div>
              ),
            },
            {
              key: "analytics",
              header: "Analytics",
              cell: (row) => (row.supports_analytics ? "Yes" : "—"),
            },
            {
              key: "accounts",
              header: "Connected accounts",
              className: "text-right tabular-nums",
              cell: (row) => row.accounts_count.toLocaleString(),
            },
            {
              key: "actions",
              header: "",
              className: "text-right whitespace-nowrap",
              cell: (row) => (
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setEditing(row)}>
                    Verification
                  </Button>
                  <Button
                    size="sm"
                    variant={row.is_enabled ? "secondary" : "primary"}
                    loading={update.isPending && update.variables?.key === row.key}
                    onClick={() =>
                      update.mutate({ key: row.key, data: { is_enabled: !row.is_enabled } })
                    }
                  >
                    {row.is_enabled ? "Disable" : "Enable"}
                  </Button>
                </div>
              ),
            },
          ]}
        />
      </Card>
      {editing && (
        <VerificationModal
          platform={editing}
          loading={update.isPending}
          onClose={() => setEditing(null)}
          onSave={(data) => update.mutate({ key: editing.key, data })}
        />
      )}
    </>
  );
}

function VerificationModal({
  platform,
  loading,
  onClose,
  onSave,
}: {
  platform: PlatformSetting;
  loading: boolean;
  onClose: () => void;
  onSave: (data: PlatformUpdate) => void;
}) {
  const [status, setStatus] = useState<AssignableStatus>(
    platform.recorded_status === "verification_expired" ? "verified" : platform.recorded_status,
  );
  const [notes, setNotes] = useState(platform.verification_notes ?? "");

  return (
    <Modal
      open
      onClose={onClose}
      title={`${platform.name} verification`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            loading={loading}
            onClick={() =>
              onSave({ verification_status: status, verification_notes: notes || null })
            }
          >
            Save
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Select
          label="Status"
          value={status}
          options={STATUS_OPTIONS}
          onChange={(event) => setStatus(event.target.value as AssignableStatus)}
        />
        <Textarea
          label="Evidence"
          hint="API version, account type, test date and outcome. Saving as verified or limited restarts the verification period."
          rows={4}
          maxLength={2000}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
      </div>
    </Modal>
  );
}

"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/components/layouts/page-header";
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  Dropdown,
  Input,
  Pagination,
  StatusBadge,
  Table,
} from "@/components/ui";
import { useCurrentUser } from "@/features/auth/hooks";
import { errorMessage } from "@/lib/api-error";
import { formatDateTime } from "@/lib/format";
import { adminsService } from "@/services/admins.service";
import { toast } from "@/stores/toast.store";
import type { User } from "@/types/user";
import { useListState } from "../use-list-state";
import { AdminFormModal } from "./admin-form-modal";

export function AdminsList() {
  const queryClient = useQueryClient();
  const { data: me } = useCurrentUser();
  const state = useListState();
  const [editing, setEditing] = useState<User | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<User | null>(null);

  const admins = useQuery({
    queryKey: ["admin", "admins", state.params],
    queryFn: () => adminsService.list(state.params),
    placeholderData: keepPreviousData,
  });

  const remove = useMutation({
    mutationFn: (id: number) => adminsService.remove(id),
    onSuccess: ({ message }) => {
      toast.success(message);
      setDeleting(null);
      void queryClient.invalidateQueries({ queryKey: ["admin", "admins"] });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  return (
    <>
      <PageHeader
        title="Admins"
        description="Manage staff accounts with access to the admin panel."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            Add admin
          </Button>
        }
      />
      <Card bodyClassName="p-0">
        <div className="border-b border-slate-100 p-4">
          <Input
            type="search"
            aria-label="Search admins"
            placeholder="Search by name or email…"
            value={state.search}
            onChange={(event) => state.setSearch(event.target.value)}
          />
        </div>
        <Table
          caption="Admins"
          rows={admins.data?.items}
          rowKey={(row) => row.id}
          isLoading={admins.isLoading}
          error={admins.error}
          onRetry={() => void admins.refetch()}
          emptyTitle="No admins found"
          columns={[
            {
              key: "name",
              header: "Name",
              cell: (row) => (
                <div>
                  <span className="font-medium text-slate-900">{row.name}</span>
                  {row.id === me?.id && <span className="ml-2 text-xs text-slate-400">(you)</span>}
                  <span className="block text-xs text-slate-500">{row.email}</span>
                </div>
              ),
            },
            {
              key: "role",
              header: "Role",
              cell: (row) => (
                <Badge tone={row.role === "superadmin" ? "brand" : "neutral"}>{row.role}</Badge>
              ),
            },
            { key: "status", header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
            {
              key: "last_login",
              header: "Last login",
              cell: (row) => formatDateTime(row.last_login_at),
            },
            {
              key: "actions",
              header: "",
              className: "text-right",
              cell: (row) => (
                <Dropdown
                  label={`Actions for ${row.name}`}
                  trigger={<span aria-hidden="true">⋯</span>}
                  items={[
                    {
                      label: "Edit",
                      onSelect: () => {
                        setEditing(row);
                        setFormOpen(true);
                      },
                    },
                    {
                      label: "Delete",
                      destructive: true,
                      disabled: row.id === me?.id,
                      onSelect: () => setDeleting(row),
                    },
                  ]}
                />
              ),
            },
          ]}
        />
        <Pagination meta={admins.data?.meta} onPageChange={state.setPage} />
      </Card>

      <AdminFormModal open={formOpen} admin={editing} onClose={() => setFormOpen(false)} />
      <ConfirmDialog
        open={deleting !== null}
        title="Delete admin?"
        description={`${deleting?.name ?? ""} will lose access to the admin panel immediately.`}
        confirmLabel="Delete"
        destructive
        loading={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}

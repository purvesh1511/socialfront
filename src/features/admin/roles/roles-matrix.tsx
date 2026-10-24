"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/components/layouts/page-header";
import { Badge, Button, Card, ErrorState, Loading } from "@/components/ui";
import { errorMessage } from "@/lib/api-error";
import { humanize } from "@/lib/format";
import { rolesService } from "@/services/roles.service";
import { toast } from "@/stores/toast.store";
import type { Permission, Role } from "@/types/admin";

export function RolesMatrix() {
  const roles = useQuery({ queryKey: ["admin", "roles"], queryFn: rolesService.list });
  const permissions = useQuery({
    queryKey: ["admin", "permissions"],
    queryFn: rolesService.permissions,
  });

  if (roles.isLoading || permissions.isLoading) return <Loading />;
  if (roles.error || permissions.error || !roles.data || !permissions.data) {
    return (
      <ErrorState error={roles.error ?? permissions.error} onRetry={() => void roles.refetch()} />
    );
  }

  return (
    <>
      <PageHeader
        title="Roles"
        description="Choose which permissions each role grants. Superadmin always has every permission."
      />
      <div className="space-y-6">
        {roles.data.map((role) => (
          <RoleCard key={role.id} role={role} permissions={permissions.data} />
        ))}
      </div>
    </>
  );
}

function RoleCard({ role, permissions }: { role: Role; permissions: Permission[] }) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<string[]>(role.permissions);
  const locked = role.name === "superadmin";
  const dirty = [...selected].sort().join() !== [...role.permissions].sort().join();

  const mutation = useMutation({
    mutationFn: () => rolesService.updatePermissions(role.id, selected),
    onSuccess: ({ message }) => {
      toast.success(message);
      void queryClient.invalidateQueries({ queryKey: ["admin", "roles"] });
      void queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const toggle = (name: string) =>
    setSelected((current) =>
      current.includes(name) ? current.filter((item) => item !== name) : [...current, name],
    );

  return (
    <Card
      title={humanize(role.name)}
      description={`${role.users_count} user${role.users_count === 1 ? "" : "s"}`}
      actions={
        locked ? (
          <Badge tone="brand">Locked</Badge>
        ) : (
          <Button
            size="sm"
            disabled={!dirty}
            loading={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            Save
          </Button>
        )
      }
    >
      <fieldset disabled={locked} className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <legend className="sr-only">Permissions for {role.name}</legend>
        {permissions.map((permission) => (
          <label key={permission.id} className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              className="accent-brand-600 size-4 rounded border-slate-300"
              checked={selected.includes(permission.name)}
              onChange={() => toggle(permission.name)}
            />
            {humanize(permission.name)}
          </label>
        ))}
      </fieldset>
    </Card>
  );
}

"use client";

import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layouts/page-header";
import { Badge, Card, Table } from "@/components/ui";
import { humanize } from "@/lib/format";
import { rolesService } from "@/services/roles.service";

export function PermissionsList() {
  const permissions = useQuery({
    queryKey: ["admin", "permissions"],
    queryFn: rolesService.permissions,
  });
  const roles = useQuery({ queryKey: ["admin", "roles"], queryFn: rolesService.list });

  return (
    <>
      <PageHeader
        title="Permissions"
        description="All permissions available in the system and the roles that grant them."
      />
      <Card bodyClassName="p-0">
        <Table
          caption="Permissions"
          rows={permissions.data}
          rowKey={(row) => row.id}
          isLoading={permissions.isLoading || roles.isLoading}
          error={permissions.error ?? roles.error}
          onRetry={() => void permissions.refetch()}
          columns={[
            {
              key: "name",
              header: "Permission",
              cell: (row) => (
                <div>
                  <span className="font-medium text-slate-900">{humanize(row.name)}</span>
                  <code className="block text-xs text-slate-500">{row.name}</code>
                </div>
              ),
            },
            {
              key: "roles",
              header: "Granted to",
              cell: (row) => (
                <div className="flex flex-wrap gap-1">
                  {roles.data
                    ?.filter((role) => role.permissions.includes(row.name))
                    .map((role) => (
                      <Badge key={role.id} tone={role.name === "superadmin" ? "brand" : "neutral"}>
                        {role.name}
                      </Badge>
                    ))}
                </div>
              ),
            },
          ]}
        />
      </Card>
    </>
  );
}

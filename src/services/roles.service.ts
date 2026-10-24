import type { Permission, Role } from "@/types/admin";
import { get, send } from "./api-client";

export const rolesService = {
  list: () => get<Role[]>("/superadmin/roles"),
  permissions: () => get<Permission[]>("/superadmin/permissions"),
  updatePermissions: (roleId: number, permissions: string[]) =>
    send<Role>("put", `/superadmin/roles/${roleId}/permissions`, { permissions }),
};

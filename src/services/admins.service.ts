import type { ListParams } from "@/types/api";
import type { User } from "@/types/user";
import type { AdminCreateInput, AdminUpdateInput } from "@/validations/admin";
import { getPaginated, send } from "./api-client";

export const adminsService = {
  list: (params: ListParams) => getPaginated<User>("/superadmin/admins", params),
  create: (input: AdminCreateInput) => send<User>("post", "/superadmin/admins", input),
  update: (id: number, input: AdminUpdateInput) =>
    send<User>("put", `/superadmin/admins/${id}`, input),
  remove: (id: number) => send<null>("delete", `/superadmin/admins/${id}`),
};

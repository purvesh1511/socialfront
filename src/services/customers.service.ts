import type { ListParams } from "@/types/api";
import type { CustomerDetail } from "@/types/admin";
import type { User, UserStatus } from "@/types/user";
import { get, getPaginated, send } from "./api-client";

export interface UpdateCustomerInput {
  name?: string;
  email?: string;
  status?: UserStatus;
  requires_post_approval?: boolean;
}

export const customersService = {
  list: (params: ListParams) => getPaginated<User>("/admin/customers", params),
  show: (id: number) => get<CustomerDetail>(`/admin/customers/${id}`),
  update: (id: number, input: UpdateCustomerInput) =>
    send<User>("put", `/admin/customers/${id}`, input),
  remove: (id: number) => send<null>("delete", `/admin/customers/${id}`),
};

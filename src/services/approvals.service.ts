import type { ListParams } from "@/types/api";
import type { Approval, ApprovalAction, ApprovalComment } from "@/types/social";
import { get, getPaginated, send } from "./api-client";

export const approvalsService = {
  // Customer
  submit: (postId: number, action: ApprovalAction, scheduledAt?: string | null) =>
    send<Approval>("post", `/customer/posts/${postId}/submit-for-approval`, {
      action,
      scheduled_at: scheduledAt ?? null,
    }),
  withdraw: (postId: number) => send<null>("post", `/customer/posts/${postId}/withdraw-approval`),
  customerComment: (approvalId: number, body: string) =>
    send<ApprovalComment>("post", `/customer/approvals/${approvalId}/comments`, { body }),

  // Admin
  list: (params: ListParams) => getPaginated<Approval>("/admin/approvals", params),
  show: (id: number) => get<Approval>(`/admin/approvals/${id}`),
  approve: (id: number, note?: string) =>
    send<Approval>("post", `/admin/approvals/${id}/approve`, { note: note || null }),
  reject: (id: number, note: string) =>
    send<Approval>("post", `/admin/approvals/${id}/reject`, { note }),
  adminComment: (id: number, body: string) =>
    send<ApprovalComment>("post", `/admin/approvals/${id}/comments`, { body }),
};

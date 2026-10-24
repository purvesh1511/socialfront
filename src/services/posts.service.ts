import type { Post, PostFilters, PostInput } from "@/types/social";
import { get, getPaginated, send } from "./api-client";

export interface CalendarFilters {
  from: string;
  to: string;
  status?: string;
  account_id?: number;
  platform?: string;
}

export const postsService = {
  list: (filters: PostFilters) => getPaginated<Post>("/customer/posts", filters),
  show: (id: number) => get<Post>(`/customer/posts/${id}`),
  create: (input: PostInput) => send<Post>("post", "/customer/posts", input),
  update: (id: number, input: PostInput) => send<Post>("put", `/customer/posts/${id}`, input),
  remove: (id: number) => send<null>("delete", `/customer/posts/${id}`),
  schedule: (id: number, scheduledAt: string) =>
    send<Post>("post", `/customer/posts/${id}/schedule`, { scheduled_at: scheduledAt }),
  reschedule: (id: number, scheduledAt: string) =>
    send<Post>("patch", `/customer/posts/${id}/reschedule`, { scheduled_at: scheduledAt }),
  queue: (id: number) => send<Post>("post", `/customer/posts/${id}/queue`),
  publish: (id: number) => send<Post>("post", `/customer/posts/${id}/publish`),
  resolveTarget: (id: number, targetId: number, published: boolean, url?: string | null) =>
    send<Post>("post", `/customer/posts/${id}/targets/${targetId}/resolve`, {
      published,
      platform_post_url: published ? url || null : null,
    }),
  unschedule: (id: number) => send<Post>("post", `/customer/posts/${id}/unschedule`),
  cancel: (id: number) => send<Post>("post", `/customer/posts/${id}/cancel`),
  duplicate: (id: number) => send<Post>("post", `/customer/posts/${id}/duplicate`),
  calendar: (filters: CalendarFilters) => get<Post[]>("/customer/calendar", filters),
};

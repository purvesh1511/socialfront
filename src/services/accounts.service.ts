import type { Platform, SocialAccount } from "@/types/social";
import { get, send } from "./api-client";

export const accountsService = {
  platforms: () => get<Platform[]>("/customer/platforms"),
  list: () => get<SocialAccount[]>("/customer/social-accounts"),
  connectUrl: (platform: string) =>
    get<{ url: string }>(`/customer/social-accounts/connect/${platform}`),
  callback: (platform: string, code: string, state: string) =>
    send<SocialAccount[]>("post", `/customer/social-accounts/callback/${platform}`, {
      code,
      state,
    }),
  connectWithCredentials: (platform: string, identifier: string, password: string) =>
    send<SocialAccount[]>("post", `/customer/social-accounts/credentials/${platform}`, {
      identifier,
      password,
    }),
  refresh: (id: number) => send<SocialAccount>("post", `/customer/social-accounts/${id}/refresh`),
  disconnect: (id: number) => send<null>("delete", `/customer/social-accounts/${id}`),
};

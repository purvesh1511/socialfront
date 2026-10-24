import type { NotificationPreference } from "@/types/social";
import type { AuthUser } from "@/types/user";
import { apiClient, get, send } from "./api-client";
import type { ApiEnvelope } from "@/types/api";
import type { ChangePasswordInput, ProfileInput } from "@/validations/profile";

export const profileService = {
  update: (input: Partial<ProfileInput>) => send<AuthUser>("put", "/profile", input),

  changePassword: (input: ChangePasswordInput) => send<null>("put", "/profile/password", input),

  notificationPreferences: () => get<NotificationPreference[]>("/profile/notification-preferences"),

  updateNotificationPreferences: (email: Record<string, boolean>) =>
    send<NotificationPreference[]>("put", "/profile/notification-preferences", { email }),

  enableTwoFactor: () =>
    send<{ secret: string; otpauth_url: string }>("post", "/profile/two-factor"),

  confirmTwoFactor: (code: string) =>
    send<{ recovery_codes: string[] }>("post", "/profile/two-factor/confirm", { code }),

  disableTwoFactor: (currentPassword: string) =>
    send<null>("delete", "/profile/two-factor", { current_password: currentPassword }),

  regenerateRecoveryCodes: (currentPassword: string) =>
    send<{ recovery_codes: string[] }>("post", "/profile/two-factor/recovery-codes", {
      current_password: currentPassword,
    }),

  uploadAvatar: async (file: File) => {
    const form = new FormData();
    form.append("avatar", file);
    const { data } = await apiClient.post<ApiEnvelope<AuthUser>>("/profile/avatar", form);
    return { data: data.data, message: data.message };
  },
};

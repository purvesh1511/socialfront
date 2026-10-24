import type { PublicSettings, Setting } from "@/types/admin";
import { get, send } from "./api-client";

export const settingsService = {
  public: () => get<PublicSettings>("/settings/public"),
  list: () => get<Setting[]>("/superadmin/settings"),
  update: (settings: Record<string, unknown>) =>
    send<Setting[]>("put", "/superadmin/settings", { settings }),
};

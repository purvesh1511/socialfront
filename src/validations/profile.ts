import { z } from "zod";

export const profileSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(255),
  email: z.email("Enter a valid email address.").max(255),
  timezone: z.string().min(1, "Timezone is required."),
});

export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, "Current password is required."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    password_confirmation: z.string(),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Passwords do not match.",
    path: ["password_confirmation"],
  });

export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];

export type ProfileInput = z.infer<typeof profileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

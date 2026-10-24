import { z } from "zod";

const staffRole = z.enum(["admin", "superadmin"]);

export const adminCreateSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required.").max(255),
    email: z.email("Enter a valid email address."),
    role: staffRole,
    password: z.string().min(8, "Password must be at least 8 characters."),
    password_confirmation: z.string(),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Passwords do not match.",
    path: ["password_confirmation"],
  });

export const adminUpdateSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(255),
  email: z.email("Enter a valid email address."),
  role: staffRole,
  status: z.enum(["active", "suspended"]),
});

export const customerUpdateSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(255),
  email: z.email("Enter a valid email address."),
  status: z.enum(["active", "suspended"]),
  requires_post_approval: z.boolean(),
});

export type AdminCreateInput = z.infer<typeof adminCreateSchema>;
export type AdminUpdateInput = Partial<z.infer<typeof adminUpdateSchema>>;
export type CustomerUpdateInput = z.infer<typeof customerUpdateSchema>;

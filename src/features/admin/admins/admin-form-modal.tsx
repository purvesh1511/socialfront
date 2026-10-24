"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Button, Input, Modal, Select } from "@/components/ui";
import { applyApiErrors } from "@/hooks/use-api-form-errors";
import { adminsService } from "@/services/admins.service";
import { toast } from "@/stores/toast.store";
import type { User } from "@/types/user";
import { adminCreateSchema, adminUpdateSchema, type AdminCreateInput } from "@/validations/admin";
import type { z } from "zod";
import { STATUS_OPTIONS } from "../status-options";

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "superadmin", label: "Superadmin" },
];

interface AdminFormModalProps {
  open: boolean;
  admin: User | null;
  onClose: () => void;
}

export function AdminFormModal({ open, admin, onClose }: AdminFormModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={admin ? "Edit admin" : "Add admin"}>
      {open &&
        (admin ? (
          <EditAdminForm admin={admin} onDone={onClose} />
        ) : (
          <CreateAdminForm onDone={onClose} />
        ))}
    </Modal>
  );
}

function useInvalidateAdmins() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["admin", "admins"] });
}

function CreateAdminForm({ onDone }: { onDone: () => void }) {
  const invalidate = useInvalidateAdmins();
  const mutation = useMutation({ mutationFn: adminsService.create });
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<AdminCreateInput>({
    resolver: zodResolver(adminCreateSchema),
    defaultValues: { role: "admin" },
  });

  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={handleSubmit((values) =>
        mutation.mutate(values, {
          onSuccess: ({ message }) => {
            toast.success(message);
            void invalidate();
            onDone();
          },
          onError: (error) => applyApiErrors(error, setError),
        }),
      )}
    >
      <Input label="Name" error={errors.name?.message} {...register("name")} />
      <Input label="Email" type="email" error={errors.email?.message} {...register("email")} />
      <Select
        label="Role"
        options={ROLE_OPTIONS}
        error={errors.role?.message}
        {...register("role")}
      />
      <Input
        label="Password"
        type="password"
        autoComplete="new-password"
        error={errors.password?.message}
        {...register("password")}
      />
      <Input
        label="Confirm password"
        type="password"
        autoComplete="new-password"
        error={errors.password_confirmation?.message}
        {...register("password_confirmation")}
      />
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" loading={mutation.isPending}>
          Create admin
        </Button>
      </div>
    </form>
  );
}

type EditValues = z.infer<typeof adminUpdateSchema>;

function EditAdminForm({ admin, onDone }: { admin: User; onDone: () => void }) {
  const invalidate = useInvalidateAdmins();
  const mutation = useMutation({
    mutationFn: (input: EditValues) => adminsService.update(admin.id, input),
  });
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<EditValues>({
    resolver: zodResolver(adminUpdateSchema),
    defaultValues: {
      name: admin.name,
      email: admin.email,
      role: admin.role === "superadmin" ? "superadmin" : "admin",
      status: admin.status,
    },
  });

  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={handleSubmit((values) =>
        mutation.mutate(values, {
          onSuccess: ({ message }) => {
            toast.success(message);
            void invalidate();
            onDone();
          },
          onError: (error) => applyApiErrors(error, setError),
        }),
      )}
    >
      <Input label="Name" error={errors.name?.message} {...register("name")} />
      <Input label="Email" type="email" error={errors.email?.message} {...register("email")} />
      <Select
        label="Role"
        options={ROLE_OPTIONS}
        error={errors.role?.message}
        {...register("role")}
      />
      <Select
        label="Status"
        options={STATUS_OPTIONS}
        error={errors.status?.message}
        {...register("status")}
      />
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" loading={mutation.isPending}>
          Save changes
        </Button>
      </div>
    </form>
  );
}

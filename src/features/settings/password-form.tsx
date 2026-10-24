"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Button, Card, Input } from "@/components/ui";
import { applyApiErrors } from "@/hooks/use-api-form-errors";
import { profileService } from "@/services/profile.service";
import { toast } from "@/stores/toast.store";
import { changePasswordSchema, type ChangePasswordInput } from "@/validations/profile";

export function PasswordForm() {
  const mutation = useMutation({ mutationFn: profileService.changePassword });
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordInput>({ resolver: zodResolver(changePasswordSchema) });

  const onSubmit = handleSubmit((values) =>
    mutation.mutate(values, {
      onSuccess: ({ message }) => {
        reset({ current_password: "", password: "", password_confirmation: "" });
        toast.success(message);
      },
      onError: (error) => applyApiErrors(error, setError),
    }),
  );

  return (
    <Card
      title="Change password"
      description="Changing your password signs you out of all other sessions."
    >
      <form onSubmit={onSubmit} className="grid gap-4 sm:max-w-lg" noValidate>
        <Input
          label="Current password"
          type="password"
          autoComplete="current-password"
          error={errors.current_password?.message}
          {...register("current_password")}
        />
        <Input
          label="New password"
          type="password"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register("password")}
        />
        <Input
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          error={errors.password_confirmation?.message}
          {...register("password_confirmation")}
        />
        <div>
          <Button type="submit" loading={mutation.isPending}>
            Update password
          </Button>
        </div>
      </form>
    </Card>
  );
}

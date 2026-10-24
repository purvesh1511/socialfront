"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button, Input } from "@/components/ui";
import { ROUTES } from "@/constants/routes";
import { applyApiErrors } from "@/hooks/use-api-form-errors";
import { authService } from "@/services/auth.service";
import { toast } from "@/stores/toast.store";
import { resetPasswordSchema, type ResetPasswordInput } from "@/validations/auth";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const mutation = useMutation({
    mutationFn: (input: ResetPasswordInput) => authService.resetPassword({ ...input, token }),
  });
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { email: searchParams.get("email") ?? "" },
  });

  if (!token) {
    return (
      <p className="text-sm text-red-600">This reset link is invalid. Please request a new one.</p>
    );
  }

  return (
    <form
      onSubmit={handleSubmit((values) =>
        mutation.mutate(values, {
          onSuccess: ({ message }) => {
            toast.success(message);
            router.replace(ROUTES.login);
          },
          onError: (error) => applyApiErrors(error, setError),
        }),
      )}
      className="space-y-4"
      noValidate
    >
      <Input
        label="Email"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register("email")}
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
      <Button type="submit" className="w-full" loading={mutation.isPending}>
        Reset password
      </Button>
    </form>
  );
}

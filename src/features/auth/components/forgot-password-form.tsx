"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Button, Input } from "@/components/ui";
import { applyApiErrors } from "@/hooks/use-api-form-errors";
import { authService } from "@/services/auth.service";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/validations/auth";

export function ForgotPasswordForm() {
  const mutation = useMutation({
    mutationFn: (input: ForgotPasswordInput) => authService.forgotPassword(input.email),
  });
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });

  if (mutation.isSuccess) {
    return (
      <p role="status" className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800">
        {mutation.data.message}
      </p>
    );
  }

  return (
    <form
      onSubmit={handleSubmit((values) =>
        mutation.mutate(values, { onError: (error) => applyApiErrors(error, setError) }),
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
      <Button type="submit" className="w-full" loading={mutation.isPending}>
        Send reset link
      </Button>
    </form>
  );
}

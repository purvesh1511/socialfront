"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button, Input } from "@/components/ui";
import { ROUTES } from "@/constants/routes";
import { applyApiErrors } from "@/hooks/use-api-form-errors";
import { toast } from "@/stores/toast.store";
import { registerSchema, type RegisterInput } from "@/validations/auth";
import { useRegister } from "../hooks";

export function RegisterForm() {
  const router = useRouter();
  const registration = useRegister();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  const onSubmit = handleSubmit((values) =>
    registration.mutate(values, {
      onSuccess: ({ message }) => {
        toast.success(message);
        router.replace(ROUTES.customer.dashboard);
        router.refresh();
      },
      onError: (error) => applyApiErrors(error, setError),
    }),
  );

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <Input
        label="Full name"
        autoComplete="name"
        error={errors.name?.message}
        {...register("name")}
      />
      <Input
        label="Email"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register("email")}
      />
      <Input
        label="Password"
        type="password"
        autoComplete="new-password"
        hint="At least 8 characters with letters and numbers."
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
      <Button type="submit" className="w-full" loading={registration.isPending}>
        Create account
      </Button>
    </form>
  );
}

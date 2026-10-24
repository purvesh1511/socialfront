"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button, Input } from "@/components/ui";
import { ROUTES } from "@/constants/routes";
import { applyApiErrors } from "@/hooks/use-api-form-errors";
import { homeForRole, safeNext } from "@/lib/access";
import { toApiError } from "@/lib/api-error";
import { needsTwoFactor, type Portal } from "@/services/auth.service";
import type { UserRole } from "@/types/user";
import { loginSchema, type LoginInput } from "@/validations/auth";
import { useLogin, useTwoFactorChallenge } from "../hooks";

export function LoginForm({ portal }: { portal: Portal }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useLogin(portal);
  const [challenge, setChallenge] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const finish = (role: UserRole | null) => {
    router.replace(safeNext(searchParams.get("next"), homeForRole(role)));
    router.refresh();
  };

  const onSubmit = handleSubmit((values) =>
    login.mutate(values, {
      onSuccess: ({ data }) => {
        if (needsTwoFactor(data)) setChallenge(data.challenge);
        else finish(data.user.role);
      },
      onError: (error) => applyApiErrors(error, setError),
    }),
  );

  if (challenge) {
    return (
      <TwoFactorStep challenge={challenge} onDone={finish} onRestart={() => setChallenge(null)} />
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
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
        autoComplete="current-password"
        error={errors.password?.message}
        {...register("password")}
      />
      <div className="flex justify-end">
        <Link
          href={ROUTES.forgotPassword}
          className="text-brand-600 hover:text-brand-700 text-sm font-medium"
        >
          Forgot password?
        </Link>
      </div>
      <Button type="submit" className="w-full" loading={login.isPending}>
        Sign in
      </Button>
    </form>
  );
}

function TwoFactorStep({
  challenge,
  onDone,
  onRestart,
}: {
  challenge: string;
  onDone: (role: UserRole | null) => void;
  onRestart: () => void;
}) {
  const verify = useTwoFactorChallenge();
  const [useRecovery, setUseRecovery] = useState(false);
  const [value, setValue] = useState("");
  const [error, setErrorText] = useState<string | undefined>();

  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (!value.trim()) {
          setErrorText(useRecovery ? "Enter a recovery code." : "Enter the 6-digit code.");
          return;
        }
        verify.mutate(
          useRecovery
            ? { challenge, recovery_code: value.trim() }
            : { challenge, code: value.replace(/\s/g, "") },
          {
            onSuccess: ({ data }) => onDone(data.user.role),
            onError: (err) => {
              const apiError = toApiError(err);
              const message = apiError.errors.code?.[0] ?? apiError.message;
              setErrorText(message);
              if (message.includes("expired")) onRestart();
            },
          },
        );
      }}
    >
      <p className="text-sm text-slate-600">
        {useRecovery
          ? "Enter one of the recovery codes you saved when you turned on two-factor authentication."
          : "Open your authenticator app and enter the 6-digit code for this account."}
      </p>
      <Input
        key={useRecovery ? "recovery" : "code"}
        label={useRecovery ? "Recovery code" : "Authentication code"}
        autoComplete="one-time-code"
        inputMode={useRecovery ? "text" : "numeric"}
        autoFocus
        value={value}
        error={error}
        onChange={(event) => {
          setValue(event.target.value);
          setErrorText(undefined);
        }}
      />
      <Button type="submit" className="w-full" loading={verify.isPending}>
        Verify
      </Button>
      <div className="flex justify-between text-sm">
        <button
          type="button"
          className="text-brand-600 hover:text-brand-700 font-medium"
          onClick={() => {
            setUseRecovery((current) => !current);
            setValue("");
            setErrorText(undefined);
          }}
        >
          {useRecovery ? "Use authenticator code" : "Use a recovery code"}
        </button>
        <button type="button" className="text-slate-500 hover:text-slate-700" onClick={onRestart}>
          Back
        </button>
      </div>
    </form>
  );
}

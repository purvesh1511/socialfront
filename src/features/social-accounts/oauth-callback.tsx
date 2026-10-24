"use client";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Loading } from "@/components/ui";
import { ROUTES } from "@/constants/routes";
import { errorMessage } from "@/lib/api-error";
import { accountsService } from "@/services/accounts.service";
import { toast } from "@/stores/toast.store";
import { accountKeys } from "./hooks";

/**
 * Landing page for the provider redirect. The OAuth state is single-use, so the exchange
 * must run exactly once (React may mount effects twice in development).
 */
export function OAuthCallback({ platform }: { platform: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const queryClient = useQueryClient();
  const started = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const code = params.get("code");
    const state = params.get("state");
    const providerError = params.get("error_description") ?? params.get("error");

    if (providerError || !code || !state) {
      setError(providerError ?? "The connection was cancelled.");
      return;
    }

    accountsService
      .callback(platform, code, state)
      .then(({ message }) => {
        toast.success(message);
        void queryClient.invalidateQueries({ queryKey: accountKeys.all });
        router.replace(ROUTES.customer.accounts);
      })
      .catch((err: unknown) => setError(errorMessage(err)));
  }, [params, platform, queryClient, router]);

  if (!error) return <Loading label="Connecting your account…" />;

  return (
    <div role="alert" className="mx-auto max-w-md space-y-4 py-12 text-center">
      <h1 className="text-lg font-semibold text-slate-900">Couldn&apos;t connect the account</h1>
      <p className="text-sm text-red-600">{error}</p>
      <Link
        href={ROUTES.customer.accounts}
        className="text-brand-600 hover:text-brand-700 text-sm font-medium"
      >
        Back to accounts
      </Link>
    </div>
  );
}

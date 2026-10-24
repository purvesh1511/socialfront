"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { Loading } from "@/components/ui";
import { ROUTES } from "@/constants/routes";
import { errorMessage } from "@/lib/api-error";
import { authService } from "@/services/auth.service";
import { authKeys } from "../hooks";

const VERIFY_PATH_PREFIX = "/api/v1/auth/email/verify/";

export function VerifyEmail() {
  const queryClient = useQueryClient();
  const path = useSearchParams().get("url") ?? "";
  const valid = path.startsWith(VERIFY_PATH_PREFIX);

  const verification = useQuery({
    queryKey: ["auth", "verify-email", path],
    queryFn: () => authService.verifyEmail(path),
    enabled: valid,
    retry: false,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (verification.isSuccess) void queryClient.invalidateQueries({ queryKey: authKeys.me });
  }, [verification.isSuccess, queryClient]);

  if (!valid) return <p className="text-sm text-red-600">This verification link is invalid.</p>;
  if (verification.isPending) return <Loading label="Verifying your email…" />;

  return (
    <div className="space-y-4 text-sm">
      {verification.isError ? (
        <p role="alert" className="text-red-600">
          {errorMessage(verification.error)} The link may have expired. Sign in and request a new
          one.
        </p>
      ) : (
        <p role="status" className="rounded-lg bg-emerald-50 p-4 text-emerald-800">
          Your email address has been verified.
        </p>
      )}
      <Link
        href={ROUTES.customer.dashboard}
        className="text-brand-600 hover:text-brand-700 font-medium"
      >
        Continue to dashboard →
      </Link>
    </div>
  );
}

"use client";

import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui";
import { useCurrentUser } from "@/features/auth/hooks";
import { errorMessage } from "@/lib/api-error";
import { authService } from "@/services/auth.service";
import { toast } from "@/stores/toast.store";

export function EmailVerificationBanner() {
  const { data: user } = useCurrentUser();
  const resend = useMutation({
    mutationFn: authService.resendVerification,
    onSuccess: ({ message }) => toast.success(message),
    onError: (error) => toast.error(errorMessage(error)),
  });

  if (!user || user.email_verified_at) return null;

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <p>
        Please verify your email address. We sent a link to <strong>{user.email}</strong>.
      </p>
      <Button
        size="sm"
        variant="secondary"
        loading={resend.isPending}
        onClick={() => resend.mutate()}
      >
        Resend link
      </Button>
    </div>
  );
}

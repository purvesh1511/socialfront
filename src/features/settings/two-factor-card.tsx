"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { Badge, Button, Card, Input, Modal } from "@/components/ui";
import { authKeys, useCurrentUser } from "@/features/auth/hooks";
import { toApiError } from "@/lib/api-error";
import { profileService } from "@/services/profile.service";
import { toast } from "@/stores/toast.store";

/** TOTP two-factor authentication: enrol (QR + confirm), recovery codes, disable. */
export function TwoFactorCard() {
  const { data: user } = useCurrentUser();
  const queryClient = useQueryClient();
  const [setup, setSetup] = useState<{ secret: string; otpauth_url: string } | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [passwordAction, setPasswordAction] = useState<"disable" | "codes" | null>(null);
  const refreshUser = () => queryClient.invalidateQueries({ queryKey: authKeys.me });

  const enable = useMutation({
    mutationFn: profileService.enableTwoFactor,
    onSuccess: ({ data }) => setSetup(data),
    onError: (error) => toast.error(toApiError(error).message),
  });

  const enabled = Boolean(user?.two_factor_enabled);

  return (
    <Card
      title="Two-factor authentication"
      description="Protect your account with a code from an authenticator app when you sign in."
      actions={enabled ? <Badge tone="success">On</Badge> : <Badge>Off</Badge>}
    >
      {enabled ? (
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => setPasswordAction("codes")}>
            New recovery codes
          </Button>
          <Button variant="danger" onClick={() => setPasswordAction("disable")}>
            Turn off
          </Button>
        </div>
      ) : (
        <Button onClick={() => enable.mutate()} loading={enable.isPending}>
          Set up two-factor authentication
        </Button>
      )}

      {setup && (
        <SetupModal
          setup={setup}
          onClose={() => setSetup(null)}
          onConfirmed={(codes) => {
            setSetup(null);
            setRecoveryCodes(codes);
            void refreshUser();
          }}
        />
      )}

      {passwordAction && (
        <PasswordModal
          action={passwordAction}
          onClose={() => setPasswordAction(null)}
          onDone={(codes) => {
            setPasswordAction(null);
            if (codes) setRecoveryCodes(codes);
            void refreshUser();
          }}
        />
      )}

      <Modal
        open={recoveryCodes !== null}
        onClose={() => setRecoveryCodes(null)}
        title="Save your recovery codes"
        footer={<Button onClick={() => setRecoveryCodes(null)}>I&apos;ve saved them</Button>}
      >
        <p className="mb-3 text-sm text-slate-600">
          Each code signs you in once if you lose access to your authenticator app. They won&apos;t
          be shown again.
        </p>
        <ul className="grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-4 font-mono text-sm">
          {recoveryCodes?.map((code) => (
            <li key={code}>{code}</li>
          ))}
        </ul>
        <Button
          variant="secondary"
          size="sm"
          className="mt-3"
          onClick={() => {
            void navigator.clipboard?.writeText(recoveryCodes?.join("\n") ?? "");
            toast.success("Recovery codes copied.");
          }}
        >
          Copy codes
        </Button>
      </Modal>
    </Card>
  );
}

function SetupModal({
  setup,
  onClose,
  onConfirmed,
}: {
  setup: { secret: string; otpauth_url: string };
  onClose: () => void;
  onConfirmed: (codes: string[]) => void;
}) {
  const [qr, setQr] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string>();

  useEffect(() => {
    QRCode.toDataURL(setup.otpauth_url, { margin: 1, width: 192 })
      .then(setQr)
      .catch(() => setQr(null));
  }, [setup.otpauth_url]);

  const confirm = useMutation({
    mutationFn: () => profileService.confirmTwoFactor(code.replace(/\s/g, "")),
    onSuccess: ({ data }) => onConfirmed(data.recovery_codes),
    onError: (err) => {
      const apiError = toApiError(err);
      setError(apiError.errors.code?.[0] ?? apiError.message);
    },
  });

  return (
    <Modal
      open
      onClose={onClose}
      title="Set up two-factor authentication"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            loading={confirm.isPending}
            disabled={code.trim().length < 6}
            onClick={() => confirm.mutate()}
          >
            Confirm
          </Button>
        </>
      }
    >
      <ol className="space-y-4 text-sm text-slate-700">
        <li>
          1. Scan this QR code with an authenticator app (Google Authenticator, 1Password, Authy…).
          {qr && (
            // eslint-disable-next-line @next/next/no-img-element -- generated data URL
            <img
              src={qr}
              alt="QR code for your authenticator app"
              className="mt-3 size-48 rounded border border-slate-200"
            />
          )}
          <p className="mt-2 text-xs text-slate-500">
            Can&apos;t scan? Enter this key manually:{" "}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-slate-800 select-all">
              {setup.secret.match(/.{1,4}/g)?.join(" ")}
            </code>
          </p>
        </li>
        <li>
          2. Enter the 6-digit code from the app.
          <div className="mt-2 max-w-48">
            <Input
              aria-label="Authentication code"
              autoComplete="one-time-code"
              inputMode="numeric"
              value={code}
              error={error}
              onChange={(event) => {
                setCode(event.target.value);
                setError(undefined);
              }}
            />
          </div>
        </li>
      </ol>
    </Modal>
  );
}

function PasswordModal({
  action,
  onClose,
  onDone,
}: {
  action: "disable" | "codes";
  onClose: () => void;
  onDone: (codes?: string[]) => void;
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>();

  const mutation = useMutation({
    mutationFn: async () =>
      action === "disable"
        ? { ...(await profileService.disableTwoFactor(password)), data: null }
        : profileService.regenerateRecoveryCodes(password),
    onSuccess: ({ data, message }) => {
      toast.success(message);
      onDone(data?.recovery_codes);
    },
    onError: (err) => {
      const apiError = toApiError(err);
      setError(apiError.errors.current_password?.[0] ?? apiError.message);
    },
  });

  return (
    <Modal
      open
      onClose={onClose}
      title={action === "disable" ? "Turn off two-factor authentication" : "New recovery codes"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant={action === "disable" ? "danger" : "primary"}
            loading={mutation.isPending}
            disabled={!password}
            onClick={() => mutation.mutate()}
          >
            {action === "disable" ? "Turn off" : "Generate"}
          </Button>
        </>
      }
    >
      <p className="mb-3 text-sm text-slate-600">
        {action === "disable"
          ? "Your account will only be protected by your password."
          : "Your existing recovery codes will stop working."}
      </p>
      <Input
        label="Current password"
        type="password"
        autoComplete="current-password"
        value={password}
        error={error}
        onChange={(event) => {
          setPassword(event.target.value);
          setError(undefined);
        }}
      />
    </Modal>
  );
}

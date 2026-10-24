"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/components/layouts/page-header";
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  Dropdown,
  EmptyState,
  ErrorState,
  Loading,
} from "@/components/ui";
import { errorMessage } from "@/lib/api-error";
import { formatDate } from "@/lib/format";
import { accountsService } from "@/services/accounts.service";
import { toast } from "@/stores/toast.store";
import type { Platform, SocialAccount } from "@/types/social";
import { AccountAvatar } from "./account-avatar";
import { BlueskyConnectModal } from "./bluesky-connect-modal";
import { accountKeys, usePlatforms, useSocialAccounts } from "./hooks";
import { PlatformBadge } from "./platform-badge";
import { PLATFORM_STATUS_TONES } from "./platform-status";

/** Accounts whose access ends within this window are flagged before publishing starts failing. */
const EXPIRY_WARNING_MS = 7 * 24 * 60 * 60 * 1000;

export function AccountsPage() {
  const accounts = useSocialAccounts();
  const platforms = usePlatforms();

  return (
    <>
      <PageHeader
        title="Social accounts"
        description="Connect the profiles, pages and channels you want to publish to."
      />
      <div className="space-y-6">
        <Card title="Connected accounts" bodyClassName="p-0">
          {accounts.isLoading ? (
            <Loading />
          ) : accounts.error ? (
            <ErrorState error={accounts.error} onRetry={() => void accounts.refetch()} />
          ) : !accounts.data?.length ? (
            <EmptyState
              title="No accounts connected yet"
              description="Connect your first account below to start publishing."
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {accounts.data.map((account) => (
                <AccountRow
                  key={account.id}
                  account={account}
                  platform={platforms.data?.find((p) => p.key === account.platform.key)}
                />
              ))}
            </ul>
          )}
        </Card>

        <Card
          title="Connect a new account"
          description="You'll be sent to the network to approve access, then brought back here. Connecting does not by itself enable publishing: automated posts go only to verified networks."
        >
          {platforms.isLoading ? <Loading /> : <ConnectGrid platforms={platforms.data ?? []} />}
        </Card>
      </div>
    </>
  );
}

function useConnect() {
  return useMutation({
    mutationFn: (platform: string) => accountsService.connectUrl(platform),
    onSuccess: (data) => window.location.assign(data.url),
    onError: (error) => toast.error(errorMessage(error)),
  });
}

function ConnectGrid({ platforms }: { platforms: Platform[] }) {
  const connect = useConnect();
  const [blueskyOpen, setBlueskyOpen] = useState(false);

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {platforms.map((platform) => (
          <button
            key={platform.key}
            type="button"
            disabled={!platform.can_connect || connect.isPending}
            title={platform.can_connect ? undefined : platform.status_label}
            onClick={() =>
              platform.auth_type === "credentials"
                ? setBlueskyOpen(true)
                : connect.mutate(platform.key)
            }
            className="hover:border-brand-500 hover:bg-brand-50 flex items-center gap-3 rounded-lg border border-slate-200 px-4 py-3 text-left text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-slate-200 disabled:hover:bg-transparent"
          >
            <PlatformBadge platform={platform.key} className="size-8 text-xs" />
            <span className="flex-1">{platform.name}</span>
            {!platform.can_connect ? (
              <span className="text-xs text-slate-400">Unavailable</span>
            ) : (
              !platform.can_publish && (
                <Badge tone={PLATFORM_STATUS_TONES[platform.status]}>{platform.status_label}</Badge>
              )
            )}
          </button>
        ))}
      </div>
      <BlueskyConnectModal open={blueskyOpen} onClose={() => setBlueskyOpen(false)} />
    </>
  );
}

function AccountRow({ account, platform }: { account: SocialAccount; platform?: Platform }) {
  const queryClient = useQueryClient();
  const connect = useConnect();
  const [confirming, setConfirming] = useState(false);
  const invalidate = () => queryClient.invalidateQueries({ queryKey: accountKeys.all });

  const refresh = useMutation({
    mutationFn: () => accountsService.refresh(account.id),
    onSuccess: ({ message }) => {
      toast.success(message);
      void invalidate();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
  const disconnect = useMutation({
    mutationFn: () => accountsService.disconnect(account.id),
    onSuccess: ({ message }) => {
      toast.success(message);
      setConfirming(false);
      void invalidate();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const needsReconnect = account.status === "reauthorization_required";
  const expiresSoon =
    !needsReconnect &&
    account.token_expires_at != null &&
    new Date(account.token_expires_at).getTime() - Date.now() < EXPIRY_WARNING_MS;

  return (
    <li className="flex flex-wrap items-center gap-4 px-5 py-4">
      <AccountAvatar account={account} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-slate-900">{account.name}</p>
        <p className="truncate text-sm text-slate-500">
          {account.platform.name}
          {account.username && ` · @${account.username.replace(/^@/, "")}`} · connected{" "}
          {formatDate(account.connected_at)}
        </p>
        {needsReconnect && account.last_error && (
          <p className="mt-1 text-xs text-red-600">{account.last_error}</p>
        )}
        {(account.granted_scopes?.length ?? 0) > 0 && (
          <p className="mt-1 truncate text-xs text-slate-400">
            Permissions: {account.granted_scopes?.join(", ")}
          </p>
        )}
      </div>
      {platform && !platform.can_publish && (
        <Badge tone={PLATFORM_STATUS_TONES[platform.status]}>
          Publishing unavailable · {platform.status_label}
        </Badge>
      )}
      {needsReconnect ? (
        <Badge tone="danger">Reauthorization required</Badge>
      ) : expiresSoon ? (
        <Badge tone="warning">Access expires {formatDate(account.token_expires_at)}</Badge>
      ) : (
        <Badge tone="success">Active</Badge>
      )}
      {needsReconnect && platform?.auth_type === "oauth2" && (
        <Button
          size="sm"
          variant="secondary"
          loading={connect.isPending}
          onClick={() => connect.mutate(account.platform.key)}
        >
          Reconnect
        </Button>
      )}
      <Dropdown
        label={`Actions for ${account.name}`}
        trigger={<span aria-hidden="true">⋯</span>}
        items={[
          {
            label: "Refresh access",
            onSelect: () => refresh.mutate(),
            disabled: refresh.isPending,
          },
          { label: "Disconnect", destructive: true, onSelect: () => setConfirming(true) },
        ]}
      />
      <ConfirmDialog
        open={confirming}
        title={`Disconnect ${account.name}?`}
        description="It will be removed from drafts and scheduled posts. Scheduled posts with no accounts left move back to drafts. Published posts are kept."
        confirmLabel="Disconnect"
        destructive
        loading={disconnect.isPending}
        onConfirm={() => disconnect.mutate()}
        onCancel={() => setConfirming(false)}
      />
    </li>
  );
}

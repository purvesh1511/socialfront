"use client";

import Link from "next/link";
import { EmptyState } from "@/components/ui";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/cn";
import { accountIssues } from "@/lib/post-validation";
import type { SocialAccount } from "@/types/social";
import { AccountAvatar } from "@/features/social-accounts/account-avatar";

interface AccountSelectorProps {
  accounts: SocialAccount[];
  selected: number[];
  onToggle: (id: number) => void;
  errorsByAccount: Record<number, string[]>;
}

export function AccountSelector({
  accounts,
  selected,
  onToggle,
  errorsByAccount,
}: AccountSelectorProps) {
  if (accounts.length === 0) {
    return (
      <EmptyState
        title="No connected accounts"
        description="Connect an account to choose where this post goes."
        action={
          <Link
            href={ROUTES.customer.accounts}
            className="text-brand-600 hover:text-brand-700 text-sm font-medium"
          >
            Connect an account →
          </Link>
        }
      />
    );
  }

  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-slate-700">Post to</legend>
      <div className="flex flex-wrap gap-2">
        {accounts.map((account) => {
          const isSelected = selected.includes(account.id);
          const issue = accountIssues(account);
          const hasErrors = isSelected && (errorsByAccount[account.id]?.length ?? 0) > 0;

          return (
            <button
              key={account.id}
              type="button"
              aria-pressed={isSelected}
              disabled={issue !== null && !isSelected}
              title={issue ?? `${account.name} (${account.platform.name})`}
              onClick={() => onToggle(account.id)}
              className={cn(
                "flex items-center gap-2 rounded-full border py-1 pr-3 pl-1 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                isSelected
                  ? "border-brand-500 bg-brand-50 text-brand-800"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
                hasErrors && "border-red-400 bg-red-50 text-red-800",
              )}
            >
              <AccountAvatar account={account} size="sm" />
              <span className="max-w-36 truncate">{account.name}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

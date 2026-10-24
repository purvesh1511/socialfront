"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Fragment, useState, type ReactNode } from "react";
import { Dropdown } from "@/components/ui";
import type { NavItem } from "@/constants/navigation";
import { useCurrentUser, useLogout } from "@/features/auth/hooks";
import { UpgradePrompt } from "@/features/billing/upgrade-prompt";
import { NotificationBell } from "@/features/notifications/notification-bell";
import { TwoFactorBanner } from "@/features/settings/two-factor-banner";
import { canSeeNavItem } from "@/lib/access";
import { cn } from "@/lib/cn";
import type { Portal } from "@/services/auth.service";
import { Logo } from "./logo";

export interface DashboardShellProps {
  portal: Portal;
  nav: NavItem[];
  profileHref: string;
  children: ReactNode;
}

export function DashboardShell({ portal, nav, profileHref, children }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: user } = useCurrentUser();
  const logout = useLogout(portal);
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleNav = nav.filter((item) => canSeeNavItem(user, item));

  const navigation = (
    <nav aria-label="Main" className="flex flex-col gap-1">
      {visibleNav.map((item, index) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const heading =
          item.section && item.section !== visibleNav[index - 1]?.section ? item.section : null;
        return (
          <Fragment key={item.href}>
            {heading && (
              <p className="mt-4 px-3 pb-1 text-xs font-semibold tracking-wide text-slate-400 uppercase">
                {heading}
              </p>
            )}
            <Link
              href={item.href}
              onClick={() => setMobileOpen(false)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium",
                active
                  ? "bg-brand-50 text-brand-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
              )}
            >
              {item.label}
            </Link>
          </Fragment>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen lg:flex">
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white px-4 py-6 lg:block">
        <Link href={visibleNav[0]?.href ?? "/"} className="mb-8 flex items-center gap-2 px-3">
          <Logo />
          {portal === "admin" && (
            <span className="text-xs font-medium text-slate-400 uppercase">Admin</span>
          )}
        </Link>
        {navigation}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Toggle navigation"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((open) => !open)}
          >
            ☰
          </button>
          <div className="flex-1" />
          <NotificationBell />
          <Dropdown
            label="Account menu"
            trigger={
              <span className="flex items-center gap-2 text-sm">
                <span className="bg-brand-100 text-brand-700 flex size-8 items-center justify-center rounded-full font-semibold">
                  {user?.name.charAt(0).toUpperCase()}
                </span>
                <span className="hidden max-w-40 truncate font-medium text-slate-700 sm:inline">
                  {user?.name}
                </span>
              </span>
            }
            items={[
              { label: "Profile", onSelect: () => router.push(profileHref) },
              { label: "Sign out", onSelect: () => logout.mutate(), destructive: true },
            ]}
          />
        </header>

        {mobileOpen && (
          <div className="border-b border-slate-200 bg-white p-4 lg:hidden">{navigation}</div>
        )}

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
          {user?.two_factor_setup_required && <TwoFactorBanner profileHref={profileHref} />}
          {children}
        </main>
        {portal === "customer" && <UpgradePrompt />}
      </div>
    </div>
  );
}

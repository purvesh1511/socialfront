"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { Fragment, useState } from "react";
import { PageHeader } from "@/components/layouts/page-header";
import { Badge, Button, Card, ErrorState, Input, Loading } from "@/components/ui";
import { errorMessage, toApiError } from "@/lib/api-error";
import { cn } from "@/lib/cn";
import { humanize } from "@/lib/format";
import { settingsService } from "@/services/settings.service";
import { systemService } from "@/services/system.service";
import { toast } from "@/stores/toast.store";
import type { Setting } from "@/types/admin";

const GROUPS: { key: string; label: string; description: string }[] = [
  { key: "general", label: "General", description: "Branding and announcements." },
  {
    key: "security",
    label: "Security",
    description: "Sign-up, sessions, passwords and two-factor authentication.",
  },
  {
    key: "email",
    label: "Email",
    description: "Outgoing mail server. Empty fields use the server's .env values.",
  },
  {
    key: "storage",
    label: "Storage",
    description: "Where uploads are stored and how large they may be.",
  },
  { key: "ai", label: "AI", description: "AI provider credentials and model." },
  { key: "billing", label: "Billing", description: "Payment gateway keys and grace period." },
  {
    key: "platforms",
    label: "Platforms",
    description: "OAuth app credentials for each social network.",
  },
];

interface PlatformGuide {
  name: string;
  consoleUrl: string;
  consoleLabel: string;
  steps: string[];
  scopes: string[];
}

// Where to create each network's OAuth app. Keys match the `{key}_client_id` setting prefix
// and the `/accounts/callback/{key}` redirect route.
const PLATFORM_GUIDES: Record<string, PlatformGuide> = {
  facebook: {
    name: "Facebook",
    consoleUrl: "https://developers.facebook.com/apps",
    consoleLabel: "Meta for Developers",
    steps: [
      "Create an app (type Business) and add the Facebook Login for Business product.",
      "Under Facebook Login → Settings, add the redirect URI below to Valid OAuth Redirect URIs.",
      "Copy the App ID and App secret from App settings → Basic.",
    ],
    scopes: [
      "pages_show_list",
      "pages_read_engagement",
      "pages_manage_posts",
      "read_insights",
      "business_management",
    ],
  },
  instagram: {
    name: "Instagram",
    consoleUrl: "https://developers.facebook.com/apps",
    consoleLabel: "Meta for Developers",
    steps: [
      "In your Meta app, add the use case “Manage messaging & content on Instagram” (API setup with Instagram login).",
      "Under step 3 “Set up Instagram business login”, add the redirect URI below.",
      "Copy the Instagram app ID and Instagram app secret shown on that page — not the Facebook App ID.",
    ],
    scopes: [
      "instagram_business_basic",
      "instagram_business_content_publish",
      "instagram_business_manage_insights",
    ],
  },
  linkedin: {
    name: "LinkedIn",
    consoleUrl: "https://www.linkedin.com/developers/apps",
    consoleLabel: "LinkedIn Developers",
    steps: [
      "Create an app linked to a LinkedIn company page.",
      "Under Products, request “Sign In with LinkedIn using OpenID Connect” and “Share on LinkedIn”.",
      "Under Auth, add the redirect URI below and copy the Client ID and Primary Client Secret.",
    ],
    scopes: ["openid", "profile", "w_member_social"],
  },
  x: {
    name: "X",
    consoleUrl: "https://developer.x.com/en/portal/dashboard",
    consoleLabel: "X Developer Portal",
    steps: [
      "Sign up for developer access, then create a Project and an App inside it (the app must belong to a project to use API v2).",
      "In the app, open User authentication settings → Set up. Set App permissions to “Read and write” and Type of App to “Web App, Automated App or Bot” (confidential client).",
      "Add the redirect URI below as Callback URI / Redirect URL, and any public https URL as Website URL. Save.",
      "Copy the OAuth 2.0 Client ID and Client Secret shown after saving — not the API Key / API Secret (consumer keys) or Bearer token. The secret is shown once; regenerate it under Keys and tokens if lost.",
      "Posting needs an API plan that includes write access; on a plan without it, connecting works but publishing fails.",
    ],
    scopes: ["tweet.read", "tweet.write", "users.read", "media.write", "offline.access"],
  },
  tiktok: {
    name: "TikTok",
    consoleUrl: "https://developers.tiktok.com/apps",
    consoleLabel: "TikTok for Developers",
    steps: [
      "Create an app and add the Login Kit and Content Posting API products.",
      "Under Login Kit, add the redirect URI below.",
      "Copy the Client key (goes in the client ID field) and Client secret. Unaudited apps can only post privately.",
    ],
    scopes: ["user.info.basic", "video.publish"],
  },
  youtube: {
    name: "YouTube",
    consoleUrl: "https://console.cloud.google.com/apis/credentials",
    consoleLabel: "Google Cloud Console",
    steps: [
      "Enable the YouTube Data API v3 in APIs & Services → Library.",
      "Configure the OAuth consent screen, then create an OAuth client ID of type Web application.",
      "Add the redirect URI below under Authorized redirect URIs and copy the Client ID and Client secret.",
    ],
    scopes: ["youtube.upload", "youtube.readonly"],
  },
  pinterest: {
    name: "Pinterest",
    consoleUrl: "https://developers.pinterest.com/apps",
    consoleLabel: "Pinterest Developers",
    steps: [
      "Connect a Pinterest business account and create an app (trial access is granted first).",
      "Add the redirect URI below under Redirect URIs.",
      "Copy the App ID and App secret key.",
    ],
    scopes: ["user_accounts:read", "boards:read", "pins:read", "pins:write"],
  },
  threads: {
    name: "Threads",
    consoleUrl: "https://developers.facebook.com/apps",
    consoleLabel: "Meta for Developers",
    steps: [
      "Create an app with the “Access the Threads API” use case.",
      "In the use case settings, add the redirect URI below as Redirect Callback URL.",
      "Copy the Threads app ID and Threads app secret from App settings → Basic.",
    ],
    scopes: ["threads_basic", "threads_content_publish", "threads_manage_insights"],
  },
  google_business: {
    name: "Google Business Profile",
    consoleUrl: "https://console.cloud.google.com/apis/credentials",
    consoleLabel: "Google Cloud Console",
    steps: [
      "Request Business Profile API access, then enable the My Business APIs in your Google Cloud project.",
      "Create an OAuth client ID of type Web application (you can reuse the YouTube one).",
      "Add the redirect URI below under Authorized redirect URIs and copy the Client ID and Client secret.",
    ],
    scopes: ["business.manage"],
  },
};

export function SystemSettingsForm() {
  const settings = useQuery({ queryKey: ["admin", "settings"], queryFn: settingsService.list });

  if (settings.isLoading) return <Loading />;
  if (settings.error || !settings.data)
    return <ErrorState error={settings.error} onRetry={() => void settings.refetch()} />;

  return (
    <>
      <PageHeader
        title="System settings"
        description="Platform-wide configuration. Changes apply immediately."
      />
      <SettingsEditor settings={settings.data} />
    </>
  );
}

function SettingsEditor({ settings }: { settings: Setting[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const groups = GROUPS.filter((group) => settings.some((setting) => setting.group === group.key));
  const requested = searchParams.get("group");
  const active = groups.find((group) => group.key === requested) ?? groups[0];

  // Secrets start empty: they're write-only, and an empty value keeps the stored one.
  const [values, setValues] = useState<Record<string, unknown>>(() =>
    Object.fromEntries(
      settings.map((setting) => [setting.key, setting.is_encrypted ? "" : setting.value]),
    ),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: () => {
      const keys = settings
        .filter((setting) => setting.group === active?.key)
        .map((setting) => setting.key);
      return settingsService.update(Object.fromEntries(keys.map((key) => [key, values[key]])));
    },
    onSuccess: ({ message }) => {
      setErrors({});
      toast.success(message);
      setValues((current) =>
        Object.fromEntries(
          Object.entries(current).map(([key, value]) => [
            key,
            settings.find((s) => s.key === key)?.is_encrypted ? "" : value,
          ]),
        ),
      );
      void queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
      void queryClient.invalidateQueries({ queryKey: ["settings", "public"] });
    },
    onError: (error) => {
      const apiError = toApiError(error);
      setErrors(
        Object.fromEntries(
          Object.entries(apiError.errors).map(([key, messages]) => [
            key.replace(/^settings\./, ""),
            messages[0] ?? "",
          ]),
        ),
      );
      toast.error(apiError.message);
    },
  });

  if (!active) return null;

  return (
    <div className="grid gap-6 lg:grid-cols-[12rem_1fr]">
      <nav aria-label="Settings sections" className="flex gap-1 overflow-x-auto lg:flex-col">
        {groups.map((group) => (
          <button
            key={group.key}
            type="button"
            aria-current={group.key === active.key ? "page" : undefined}
            onClick={() => router.replace(`?group=${group.key}`, { scroll: false })}
            className={cn(
              "rounded-lg px-3 py-2 text-left text-sm font-medium whitespace-nowrap",
              group.key === active.key
                ? "bg-brand-50 text-brand-700"
                : "text-slate-600 hover:bg-slate-100",
            )}
          >
            {group.label}
          </button>
        ))}
      </nav>
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          mutation.mutate();
        }}
      >
        <Card title={active.label} description={active.description}>
          <div className="grid gap-5 sm:max-w-xl">
            {settings
              .filter((setting) => setting.group === active.key)
              .map((setting) => {
                const guideKey =
                  active.key === "platforms" ? setting.key.replace(/_client_id$/, "") : null;
                const guide =
                  guideKey && guideKey !== setting.key ? PLATFORM_GUIDES[guideKey] : null;

                return (
                  <Fragment key={setting.key}>
                    {guide && guideKey && <PlatformGuideNote platform={guideKey} guide={guide} />}
                    <SettingField
                      setting={setting}
                      value={values[setting.key]}
                      error={errors[setting.key]}
                      onChange={(value) =>
                        setValues((current) => ({ ...current, [setting.key]: value }))
                      }
                    />
                  </Fragment>
                );
              })}
          </div>
          <div className="mt-6 flex flex-wrap gap-3 border-t border-slate-100 pt-4">
            <Button type="submit" loading={mutation.isPending}>
              Save {active.label.toLowerCase()} settings
            </Button>
            {active.key === "email" && <TestEmailButton />}
          </div>
        </Card>
      </form>
    </div>
  );
}

function TestEmailButton() {
  const send = useMutation({
    mutationFn: systemService.testEmail,
    onSuccess: ({ message }) => toast.success(message),
    onError: (error) => toast.error(errorMessage(error)),
  });

  return (
    <Button
      type="button"
      variant="secondary"
      loading={send.isPending}
      onClick={() => send.mutate()}
    >
      Send test email
    </Button>
  );
}

function PlatformGuideNote({ platform, guide }: { platform: string; guide: PlatformGuide }) {
  const redirectUri = `${typeof window === "undefined" ? "" : window.location.origin}/accounts/callback/${platform}`;

  return (
    <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 first:mt-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold text-slate-800">{guide.name}</h3>
        <a
          href={guide.consoleUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-700 font-medium hover:underline"
        >
          Open {guide.consoleLabel} ↗
        </a>
      </div>
      <ol className="mt-2 list-decimal space-y-1 pl-5">
        {guide.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-slate-500">Redirect URI</span>
        <code className="rounded bg-white px-2 py-0.5 text-xs break-all text-slate-800 ring-1 ring-slate-200">
          {redirectUri}
        </code>
        <button
          type="button"
          className="text-brand-700 text-xs font-medium hover:underline"
          onClick={() =>
            void navigator.clipboard
              .writeText(redirectUri)
              .then(() => toast.success("Redirect URI copied."))
              .catch(() => toast.error("Couldn't copy — select and copy it manually."))
          }
        >
          Copy
        </button>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Permissions requested: {guide.scopes.join(", ")}
      </p>
    </div>
  );
}

interface SettingFieldProps {
  setting: Setting;
  value: unknown;
  error?: string;
  onChange: (value: unknown) => void;
}

function SettingField({ setting, value, error, onChange }: SettingFieldProps) {
  const label = setting.label ?? humanize(setting.key);
  const hint = [
    setting.description,
    setting.is_public ? "Visible to everyone." : null,
    setting.overrides_config && !setting.is_encrypted && (value === null || value === "")
      ? "Empty = server default."
      : null,
  ]
    .filter(Boolean)
    .join(" ");

  if (setting.type === "boolean") {
    return (
      <label className="flex items-start gap-3 text-sm text-slate-700">
        <input
          type="checkbox"
          className="accent-brand-600 mt-0.5 size-4 rounded border-slate-300"
          checked={Boolean(value)}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span>
          <span className="font-medium">{label}</span>
          {hint && <span className="block text-xs text-slate-500">{hint}</span>}
          {error && <span className="block text-red-600">{error}</span>}
        </span>
      </label>
    );
  }

  if (setting.is_encrypted) {
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-700">{label}</span>
          {setting.has_value ? <Badge tone="success">Set</Badge> : <Badge>Not set</Badge>}
        </div>
        <Input
          aria-label={label}
          type="password"
          autoComplete="new-password"
          placeholder={setting.has_value ? "•••••••• (leave empty to keep)" : "Enter value"}
          value={String(value ?? "")}
          error={error}
          hint="Stored encrypted and never shown again."
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    );
  }

  return (
    <Input
      label={label}
      type={setting.type === "integer" ? "number" : "text"}
      value={value === null || value === undefined ? "" : String(value)}
      error={error}
      hint={hint || undefined}
      onChange={(event) =>
        onChange(
          setting.type === "integer"
            ? event.target.value === ""
              ? null
              : Number(event.target.value)
            : event.target.value || null,
        )
      }
    />
  );
}

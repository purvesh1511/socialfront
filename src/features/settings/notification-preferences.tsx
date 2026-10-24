"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, ErrorState, Loading } from "@/components/ui";
import { errorMessage } from "@/lib/api-error";
import { profileService } from "@/services/profile.service";
import { toast } from "@/stores/toast.store";
import type { NotificationPreference } from "@/types/social";

const KEY = ["profile", "notification-preferences"] as const;

/** Email opt-in per notification type. In-app notifications are always on. */
export function NotificationPreferences({ events }: { events?: string[] }) {
  const queryClient = useQueryClient();
  const prefs = useQuery({ queryKey: KEY, queryFn: profileService.notificationPreferences });
  const save = useMutation({
    mutationFn: (email: Record<string, boolean>) =>
      profileService.updateNotificationPreferences(email),
    onSuccess: ({ data, message }) => {
      queryClient.setQueryData(KEY, data);
      toast.success(message);
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const visible = (prefs.data ?? []).filter(
    (pref: NotificationPreference) => !events || events.includes(pref.event),
  );

  return (
    <Card
      title="Email notifications"
      description="Choose which updates are also sent by email. You'll always see them in the app."
    >
      {prefs.isLoading ? (
        <Loading />
      ) : prefs.error ? (
        <ErrorState error={prefs.error} onRetry={() => void prefs.refetch()} />
      ) : (
        <ul className="divide-y divide-slate-100">
          {visible.map((pref) => (
            <li key={pref.event} className="flex items-center justify-between gap-4 py-3">
              <label htmlFor={`pref-${pref.event}`} className="text-sm text-slate-700">
                {pref.label}
              </label>
              <input
                id={`pref-${pref.event}`}
                type="checkbox"
                role="switch"
                checked={pref.email}
                disabled={save.isPending}
                onChange={(event) => save.mutate({ [pref.event]: event.target.checked })}
                className="accent-brand-600 size-4"
              />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

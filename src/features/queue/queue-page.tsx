"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/components/layouts/page-header";
import { Button, Card, EmptyState, ErrorState, Loading, Select } from "@/components/ui";
import { PERMISSIONS } from "@/constants/permissions";
import { TIMEZONES } from "@/constants/navigation";
import { ROUTES } from "@/constants/routes";
import { WEEKDAYS } from "@/constants/social";
import { usePermission } from "@/features/auth/hooks";
import { AccountAvatar } from "@/features/social-accounts/account-avatar";
import { errorMessage } from "@/lib/api-error";
import { formatDateTime } from "@/lib/format";
import { addSlot, removeSlot, slotsForDay } from "@/lib/schedule";
import { scheduleService } from "@/services/schedule.service";
import { toast } from "@/stores/toast.store";
import type { PublishingSchedule } from "@/types/social";

export function QueuePage() {
  const schedule = useQuery({ queryKey: ["queue", "schedule"], queryFn: scheduleService.get });
  const upcoming = useQuery({ queryKey: ["queue", "upcoming"], queryFn: scheduleService.upcoming });

  return (
    <>
      <PageHeader
        title="Queue"
        description="Posts added to the queue take the next free time slot in your weekly schedule."
      />
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          {schedule.isLoading ? (
            <Loading />
          ) : schedule.error || !schedule.data ? (
            <ErrorState error={schedule.error} onRetry={() => void schedule.refetch()} />
          ) : (
            <ScheduleEditor initial={schedule.data} />
          )}
        </div>
        <Card title="Up next" className="lg:col-span-2" bodyClassName="p-0">
          {upcoming.isLoading ? (
            <Loading />
          ) : !upcoming.data?.length ? (
            <EmptyState
              title="Your queue is empty"
              action={
                <Link
                  href={ROUTES.posts.create}
                  className="text-brand-600 hover:text-brand-700 text-sm font-medium"
                >
                  Create a post →
                </Link>
              }
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {upcoming.data.map((entry) => (
                <li key={entry.post.id}>
                  <Link
                    href={ROUTES.posts.detail(entry.post.id)}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-brand-700 text-xs font-semibold">
                        {formatDateTime(entry.slot_at)}
                      </p>
                      <p className="truncate text-sm text-slate-700">
                        {entry.post.content || "(media)"}
                      </p>
                    </div>
                    <div className="flex -space-x-1">
                      {entry.post.targets.slice(0, 3).map((target) => (
                        <AccountAvatar key={target.id} account={target.account} size="sm" />
                      ))}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}

function ScheduleEditor({ initial }: { initial: PublishingSchedule }) {
  const queryClient = useQueryClient();
  const canEdit = usePermission(PERMISSIONS.schedulePosts);
  const [schedule, setSchedule] = useState(initial);
  const [newTimes, setNewTimes] = useState<Record<number, string>>({});

  const save = useMutation({
    mutationFn: () => scheduleService.update(schedule),
    onSuccess: ({ data, message }) => {
      setSchedule(data);
      toast.success(message);
      void queryClient.invalidateQueries({ queryKey: ["queue"] });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  return (
    <Card
      title="Weekly time slots"
      actions={
        canEdit && (
          <Button size="sm" loading={save.isPending} onClick={() => save.mutate()}>
            Save schedule
          </Button>
        )
      }
    >
      <div className="mb-5 max-w-xs">
        <Select
          label="Timezone"
          disabled={!canEdit}
          value={schedule.timezone}
          onChange={(e) => setSchedule({ ...schedule, timezone: e.target.value })}
          options={TIMEZONES.map((zone) => ({ value: zone, label: zone }))}
        />
      </div>
      <ul className="divide-y divide-slate-100">
        {WEEKDAYS.map((label, day) => (
          <li key={label} className="flex flex-wrap items-center gap-2 py-3">
            <span className="w-28 text-sm font-medium text-slate-700">{label}</span>
            <div className="flex flex-1 flex-wrap gap-2">
              {slotsForDay(schedule.slots, day).map((time) => (
                <span
                  key={time}
                  className="bg-brand-50 text-brand-800 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm"
                >
                  {time}
                  {canEdit && (
                    <button
                      type="button"
                      aria-label={`Remove ${label} ${time}`}
                      onClick={() =>
                        setSchedule({ ...schedule, slots: removeSlot(schedule.slots, day, time) })
                      }
                      className="text-brand-500 hover:text-brand-800"
                    >
                      ✕
                    </button>
                  )}
                </span>
              ))}
              {slotsForDay(schedule.slots, day).length === 0 && (
                <span className="text-sm text-slate-400">No slots</span>
              )}
            </div>
            {canEdit && (
              <form
                className="flex items-center gap-1"
                onSubmit={(event) => {
                  event.preventDefault();
                  const time = newTimes[day];
                  if (!time) return;
                  setSchedule({ ...schedule, slots: addSlot(schedule.slots, day, time) });
                  setNewTimes({ ...newTimes, [day]: "" });
                }}
              >
                <input
                  type="time"
                  aria-label={`New time for ${label}`}
                  value={newTimes[day] ?? ""}
                  onChange={(e) => setNewTimes({ ...newTimes, [day]: e.target.value })}
                  className="h-8 rounded-lg border border-slate-300 px-2 text-sm"
                />
                <Button type="submit" size="sm" variant="ghost">
                  Add
                </Button>
              </form>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}

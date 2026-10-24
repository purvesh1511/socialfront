"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/components/layouts/page-header";
import { Button, Card, ErrorState, Loading, Select, Textarea } from "@/components/ui";
import { ROUTES } from "@/constants/routes";
import { useCurrentUser } from "@/features/auth/hooks";
import { errorMessage, toApiError } from "@/lib/api-error";
import { cn } from "@/lib/cn";
import { formatDateTime, humanize } from "@/lib/format";
import { supportService, type SupportScope } from "@/services/support.service";
import { toast } from "@/stores/toast.store";
import type { SupportTicket, TicketPriority, TicketStatus } from "@/types/support";
import {
  PRIORITY_OPTIONS,
  PriorityBadge,
  STATUS_OPTIONS,
  TicketStatusBadge,
} from "./support-labels";

export function TicketDetail({ scope, id }: { scope: SupportScope; id: number }) {
  const staff = scope === "admin";
  const ticket = useQuery({
    queryKey: ["support", scope, "ticket", id],
    queryFn: () => supportService.show(scope, id),
  });

  if (ticket.isLoading) return <Loading />;
  if (ticket.error || !ticket.data)
    return <ErrorState error={ticket.error} onRetry={() => void ticket.refetch()} />;

  const data = ticket.data;

  return (
    <>
      <PageHeader
        title={data.subject}
        description={`${humanize(data.category)} · opened ${formatDateTime(data.created_at)}`}
        actions={
          <Link
            href={staff ? ROUTES.admin.support : ROUTES.customer.support}
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            ← All tickets
          </Link>
        }
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Conversation">
            <ol className="space-y-4">
              {data.messages?.map((message) => (
                <li
                  key={message.id}
                  className={cn(
                    "rounded-lg border p-4",
                    message.is_staff
                      ? "border-brand-100 bg-brand-50/50"
                      : "border-slate-200 bg-white",
                  )}
                >
                  <p className="mb-2 text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">
                      {message.is_staff
                        ? `${message.author ?? "Support"} (Support)`
                        : (message.author ?? "Customer")}
                    </span>{" "}
                    · {formatDateTime(message.created_at)}
                  </p>
                  <p className="text-sm whitespace-pre-wrap text-slate-800">{message.body}</p>
                </li>
              ))}
            </ol>
          </Card>
          <ReplyForm scope={scope} ticket={data} />
        </div>
        <div className="space-y-6">
          <Card title="Details">
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-slate-500">Status</dt>
                <dd className="mt-1">
                  <TicketStatusBadge status={data.status} staff={staff} />
                </dd>
              </div>
              {staff && (
                <>
                  <div>
                    <dt className="text-slate-500">Customer</dt>
                    <dd className="mt-1 font-medium">
                      {data.customer ? (
                        <Link
                          href={`${ROUTES.admin.customers}/${data.customer.id}`}
                          className="text-brand-700 hover:underline"
                        >
                          {data.customer.name}
                        </Link>
                      ) : (
                        "—"
                      )}
                      <span className="block text-xs font-normal text-slate-500">
                        {data.customer?.email}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Priority</dt>
                    <dd className="mt-1">
                      <PriorityBadge priority={data.priority} />
                    </dd>
                  </div>
                </>
              )}
            </dl>
          </Card>
          {staff ? <StaffControls ticket={data} /> : <CustomerControls ticket={data} />}
        </div>
      </div>
    </>
  );
}

function ReplyForm({ scope, ticket }: { scope: SupportScope; ticket: SupportTicket }) {
  const queryClient = useQueryClient();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string>();
  const reply = useMutation({
    mutationFn: () => supportService.reply(scope, ticket.id, body),
    onSuccess: ({ data, message }) => {
      setBody("");
      toast.success(message);
      queryClient.setQueryData(["support", scope, "ticket", ticket.id], data);
      void queryClient.invalidateQueries({ queryKey: ["support", scope], exact: false });
    },
    onError: (err) => {
      const apiError = toApiError(err);
      setError(apiError.errors.body?.[0] ?? apiError.message);
    },
  });

  return (
    <Card title={ticket.status === "closed" ? "Reopen with a reply" : "Reply"}>
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (!body.trim()) {
            setError("Write a message first.");
            return;
          }
          reply.mutate();
        }}
      >
        <Textarea
          aria-label="Reply"
          rows={4}
          maxLength={5000}
          value={body}
          error={error}
          onChange={(event) => {
            setBody(event.target.value);
            setError(undefined);
          }}
        />
        <Button type="submit" loading={reply.isPending}>
          Send reply
        </Button>
      </form>
    </Card>
  );
}

function CustomerControls({ ticket }: { ticket: SupportTicket }) {
  const queryClient = useQueryClient();
  const close = useMutation({
    mutationFn: () => supportService.close(ticket.id),
    onSuccess: ({ data, message }) => {
      toast.success(message);
      queryClient.setQueryData(["support", "customer", "ticket", ticket.id], data);
      void queryClient.invalidateQueries({ queryKey: ["support", "customer"] });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  if (ticket.status === "closed") return null;

  return (
    <Card title="Resolved?">
      <p className="mb-3 text-sm text-slate-600">Close the ticket when your issue is sorted.</p>
      <Button variant="secondary" loading={close.isPending} onClick={() => close.mutate()}>
        Close ticket
      </Button>
    </Card>
  );
}

function StaffControls({ ticket }: { ticket: SupportTicket }) {
  const queryClient = useQueryClient();
  const { data: me } = useCurrentUser();
  const update = useMutation({
    mutationFn: (input: {
      status?: TicketStatus;
      priority?: TicketPriority;
      assigned_to?: number | null;
    }) => supportService.update(ticket.id, input),
    onSuccess: ({ data, message }) => {
      toast.success(message);
      queryClient.setQueryData(["support", "admin", "ticket", ticket.id], data);
      void queryClient.invalidateQueries({ queryKey: ["support", "admin"] });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  return (
    <Card title="Manage">
      <div className="space-y-4">
        <Select
          label="Status"
          value={ticket.status}
          options={STATUS_OPTIONS}
          disabled={update.isPending}
          onChange={(event) => update.mutate({ status: event.target.value as TicketStatus })}
        />
        <Select
          label="Priority"
          value={ticket.priority}
          options={PRIORITY_OPTIONS}
          disabled={update.isPending}
          onChange={(event) => update.mutate({ priority: event.target.value as TicketPriority })}
        />
        <div className="text-sm">
          <p className="text-slate-500">Assignee</p>
          <p className="mt-1 font-medium text-slate-800">{ticket.assignee?.name ?? "Unassigned"}</p>
          <div className="mt-2 flex gap-2">
            {me && ticket.assignee?.id !== me.id && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => update.mutate({ assigned_to: me.id })}
              >
                Assign to me
              </Button>
            )}
            {ticket.assignee && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => update.mutate({ assigned_to: null })}
              >
                Unassign
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

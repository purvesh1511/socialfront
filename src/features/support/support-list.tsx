"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { PageHeader } from "@/components/layouts/page-header";
import {
  Button,
  Card,
  Input,
  Modal,
  Pagination,
  Select,
  Table,
  Textarea,
  type Column,
} from "@/components/ui";
import { ROUTES } from "@/constants/routes";
import { toApiError } from "@/lib/api-error";
import { formatDateTime } from "@/lib/format";
import { supportService, type SupportScope } from "@/services/support.service";
import { toast } from "@/stores/toast.store";
import type { SupportTicket, TicketCategory } from "@/types/support";
import { useDebounce } from "@/hooks/use-debounce";
import {
  CATEGORY_OPTIONS,
  PriorityBadge,
  STATUS_OPTIONS,
  TicketStatusBadge,
} from "./support-labels";

export function SupportList({ scope }: { scope: SupportScope }) {
  const searchParams = useSearchParams();
  const staff = scope === "admin";
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState(staff ? "open" : "");
  const [search, setSearch] = useState("");
  const [mine, setMine] = useState(false);
  const [creating, setCreating] = useState(searchParams.get("new") === "1");
  const debouncedSearch = useDebounce(search);
  const detailHref = (id: number) =>
    `${staff ? ROUTES.admin.support : ROUTES.customer.support}/${id}`;

  const params = { page, status: status || undefined, search: debouncedSearch || undefined, mine };
  const columns: Column<SupportTicket>[] = [
    {
      key: "subject",
      header: "Subject",
      className: "whitespace-normal",
      cell: (row) => (
        <Link href={detailHref(row.id)} className="text-brand-700 font-medium hover:underline">
          {row.subject}
        </Link>
      ),
    },
    ...(staff
      ? ([
          { key: "customer", header: "Customer", cell: (row) => row.customer?.email ?? "—" },
          {
            key: "priority",
            header: "Priority",
            cell: (row) => <PriorityBadge priority={row.priority} />,
          },
          {
            key: "assignee",
            header: "Assignee",
            cell: (row) => row.assignee?.name ?? "Unassigned",
          },
        ] satisfies Column<SupportTicket>[])
      : []),
    {
      key: "status",
      header: "Status",
      cell: (row) => <TicketStatusBadge status={row.status} staff={staff} />,
    },
    { key: "updated", header: "Last update", cell: (row) => formatDateTime(row.last_reply_at) },
  ];

  const tickets = useQuery({
    queryKey: ["support", scope, params],
    queryFn: () => supportService.list(scope, params),
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <PageHeader
        title="Support"
        description={staff ? "Customer questions and issues." : "Get help from our team."}
        actions={!staff && <Button onClick={() => setCreating(true)}>New ticket</Button>}
      />
      <Card bodyClassName="p-0">
        <div className="flex flex-wrap gap-3 border-b border-slate-100 p-4">
          {staff && (
            <div className="min-w-60 flex-1">
              <Input
                type="search"
                aria-label="Search tickets"
                placeholder="Search subject or customer email…"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
              />
            </div>
          )}
          <div className="w-56">
            <Select
              aria-label="Filter by status"
              placeholder="All statuses"
              value={status}
              options={STATUS_OPTIONS}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
            />
          </div>
          {staff && (
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                className="accent-brand-600 size-4"
                checked={mine}
                onChange={(event) => {
                  setMine(event.target.checked);
                  setPage(1);
                }}
              />
              Assigned to me
            </label>
          )}
        </div>
        <Table
          rows={tickets.data?.items}
          rowKey={(row) => row.id}
          isLoading={tickets.isLoading}
          error={tickets.error}
          onRetry={() => void tickets.refetch()}
          emptyTitle={staff ? "No tickets match" : "No tickets yet"}
          emptyDescription={staff ? undefined : "Open a ticket and we'll get back to you by email."}
          columns={columns}
        />
        <Pagination meta={tickets.data?.meta} onPageChange={setPage} />
      </Card>
      {!staff && (
        <NewTicketModal
          open={creating}
          defaultCategory={(searchParams.get("category") as TicketCategory | null) ?? "technical"}
          onClose={() => setCreating(false)}
        />
      )}
    </>
  );
}

function NewTicketModal({
  open,
  defaultCategory,
  onClose,
}: {
  open: boolean;
  defaultCategory: TicketCategory;
  onClose: () => void;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<TicketCategory>(defaultCategory);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  const create = useMutation({
    mutationFn: () => supportService.create({ subject, category, message }),
    onSuccess: ({ data, message: text }) => {
      toast.success(text);
      void queryClient.invalidateQueries({ queryKey: ["support"] });
      router.push(`${ROUTES.customer.support}/${data.id}`);
    },
    onError: (error) => {
      const apiError = toApiError(error);
      setErrors(
        Object.fromEntries(Object.entries(apiError.errors).map(([key, value]) => [key, value[0]])),
      );
      if (!apiError.isValidation) toast.error(apiError.message);
    },
  });

  const submit = () => {
    const local = {
      subject: subject.trim() ? undefined : "Add a short subject.",
      message: message.trim() ? undefined : "Describe the problem.",
    };
    setErrors(local);
    if (!local.subject && !local.message) create.mutate();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New support ticket"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={create.isPending} onClick={submit}>
            Send
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input
          label="Subject"
          maxLength={200}
          value={subject}
          error={errors.subject}
          onChange={(event) => setSubject(event.target.value)}
        />
        <Select
          label="Category"
          value={category}
          options={CATEGORY_OPTIONS}
          error={errors.category}
          onChange={(event) => setCategory(event.target.value as TicketCategory)}
        />
        <Textarea
          label="Message"
          rows={6}
          maxLength={5000}
          value={message}
          error={errors.message}
          hint="Include links to posts or the account name if relevant."
          onChange={(event) => setMessage(event.target.value)}
        />
      </div>
    </Modal>
  );
}

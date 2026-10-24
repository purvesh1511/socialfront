"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { PageHeader } from "@/components/layouts/page-header";
import {
  Button,
  Card,
  ConfirmDialog,
  ErrorState,
  Input,
  Loading,
  Select,
  StatusBadge,
} from "@/components/ui";
import { PERMISSIONS } from "@/constants/permissions";
import { ROUTES } from "@/constants/routes";
import { usePermission } from "@/features/auth/hooks";
import { CustomerBillingCard } from "@/features/admin/billing/customer-billing-card";
import { ActivityList } from "@/features/dashboard/activity-list";
import { applyApiErrors } from "@/hooks/use-api-form-errors";
import { errorMessage } from "@/lib/api-error";
import { formatDateTime } from "@/lib/format";
import { customersService } from "@/services/customers.service";
import { toast } from "@/stores/toast.store";
import type { User } from "@/types/user";
import { customerUpdateSchema, type CustomerUpdateInput } from "@/validations/admin";
import { STATUS_OPTIONS } from "../status-options";

export function CustomerDetail({ id }: { id: number }) {
  const canManageBilling = usePermission(PERMISSIONS.manageSubscriptions);
  const detail = useQuery({
    queryKey: ["admin", "customers", id],
    queryFn: () => customersService.show(id),
  });

  if (detail.isLoading) return <Loading />;
  if (detail.error || !detail.data)
    return <ErrorState error={detail.error} onRetry={() => void detail.refetch()} />;

  const { customer, recent_activity: activity } = detail.data;

  return (
    <>
      <PageHeader
        title={customer.name}
        description={customer.email}
        actions={<StatusBadge status={customer.status} />}
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <CustomerEditForm customer={customer} />
          {canManageBilling && <CustomerBillingCard customerId={customer.id} />}
          <Card title="Recent activity">
            <ActivityList items={activity} />
          </Card>
        </div>
        <div className="space-y-6">
          <Card title="Account">
            <dl className="space-y-3 text-sm">
              <Detail
                label="Email verified"
                value={
                  customer.email_verified_at ? formatDateTime(customer.email_verified_at) : "No"
                }
              />
              <Detail label="Last login" value={formatDateTime(customer.last_login_at)} />
              <Detail label="Joined" value={formatDateTime(customer.created_at)} />
              <Detail label="Timezone" value={customer.timezone} />
            </dl>
          </Card>
          <DangerZone customer={customer} />
        </div>
      </div>
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-800">{value}</dd>
    </div>
  );
}

function CustomerEditForm({ customer }: { customer: User }) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (input: CustomerUpdateInput) => customersService.update(customer.id, input),
  });
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isDirty },
  } = useForm<CustomerUpdateInput>({
    resolver: zodResolver(customerUpdateSchema),
    values: {
      name: customer.name,
      email: customer.email,
      status: customer.status,
      requires_post_approval: Boolean(customer.requires_post_approval),
    },
  });

  return (
    <Card title="Edit customer">
      <form
        noValidate
        className="grid gap-4 sm:grid-cols-2"
        onSubmit={handleSubmit((values) =>
          mutation.mutate(values, {
            onSuccess: ({ message }) => {
              toast.success(message);
              void queryClient.invalidateQueries({ queryKey: ["admin", "customers"] });
            },
            onError: (error) => applyApiErrors(error, setError),
          }),
        )}
      >
        <Input label="Name" error={errors.name?.message} {...register("name")} />
        <Input label="Email" type="email" error={errors.email?.message} {...register("email")} />
        <Select
          label="Status"
          options={STATUS_OPTIONS}
          error={errors.status?.message}
          {...register("status")}
        />
        <label className="flex items-center gap-2 text-sm text-slate-700 sm:col-span-2">
          <input
            type="checkbox"
            className="accent-brand-600 size-4"
            {...register("requires_post_approval")}
          />
          Require approval before this customer&apos;s posts are scheduled or published
        </label>
        <div className="flex items-end">
          <Button type="submit" loading={mutation.isPending} disabled={!isDirty}>
            Save changes
          </Button>
        </div>
        <p className="text-xs text-slate-500 sm:col-span-2">
          Suspending a customer signs them out immediately.
        </p>
      </form>
    </Card>
  );
}

function DangerZone({ customer }: { customer: User }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(false);
  const remove = useMutation({
    mutationFn: () => customersService.remove(customer.id),
    onSuccess: ({ message }) => {
      toast.success(message);
      void queryClient.invalidateQueries({ queryKey: ["admin", "customers"] });
      router.replace(ROUTES.admin.customers);
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  return (
    <Card title="Danger zone">
      <p className="mb-3 text-sm text-slate-600">
        Deleting a customer revokes access and hides the account.
      </p>
      <Button variant="danger" onClick={() => setConfirming(true)}>
        Delete customer
      </Button>
      <ConfirmDialog
        open={confirming}
        title="Delete customer?"
        description={`${customer.name} (${customer.email}) will lose access immediately.`}
        confirmLabel="Delete"
        destructive
        loading={remove.isPending}
        onConfirm={() => remove.mutate()}
        onCancel={() => setConfirming(false)}
      />
    </Card>
  );
}

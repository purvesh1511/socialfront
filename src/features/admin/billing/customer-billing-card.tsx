"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button, Card, ErrorState, Input, Loading, Modal, Select, Textarea } from "@/components/ui";
import { SubscriptionStatusBadge } from "@/features/billing/billing-badges";
import { UsageMeters } from "@/features/billing/usage-meters";
import { toApiError } from "@/lib/api-error";
import { formatDate, formatMoney } from "@/lib/format";
import { billingService } from "@/services/billing.service";
import { toast } from "@/stores/toast.store";
import type { Plan } from "@/types/billing";

/** Plan, usage and manual plan assignment on the admin customer page. */
export function CustomerBillingCard({ customerId }: { customerId: number }) {
  const [assigning, setAssigning] = useState(false);
  const billing = useQuery({
    queryKey: ["admin", "customers", customerId, "billing"],
    queryFn: () => billingService.customerBilling(customerId),
  });

  return (
    <Card
      title="Plan & usage"
      actions={
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setAssigning(true)}
          disabled={!billing.data}
        >
          Change plan
        </Button>
      }
    >
      {billing.isLoading ? (
        <Loading />
      ) : billing.error || !billing.data ? (
        <ErrorState error={billing.error} onRetry={() => void billing.refetch()} />
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-lg font-semibold text-slate-900">
              {billing.data.plan?.name ?? "Free"}
            </p>
            {billing.data.subscription && (
              <SubscriptionStatusBadge status={billing.data.subscription.status} />
            )}
            {billing.data.subscription && (
              <span className="text-sm text-slate-500">
                {billing.data.subscription.gateway === "manual"
                  ? "Assigned manually"
                  : billing.data.subscription.gateway}
                {(billing.data.subscription.current_period_end ??
                  billing.data.subscription.ends_at) &&
                  ` · until ${formatDate(billing.data.subscription.current_period_end ?? billing.data.subscription.ends_at)}`}
              </span>
            )}
          </div>
          <UsageMeters usage={billing.data.usage} />
          {billing.data.invoices.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-slate-700">Recent invoices</h3>
              <ul className="divide-y divide-slate-100 text-sm">
                {billing.data.invoices.map((invoice) => (
                  <li key={invoice.id} className="flex justify-between py-2">
                    <span>
                      {invoice.number} · {formatDate(invoice.issued_at)}
                    </span>
                    <span className="font-medium">
                      {formatMoney(invoice.total, invoice.currency)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {assigning && (
            <AssignPlanModal
              customerId={customerId}
              plans={billing.data.plans}
              currentPlanId={billing.data.plan?.id ?? null}
              onClose={() => setAssigning(false)}
            />
          )}
        </div>
      )}
    </Card>
  );
}

function AssignPlanModal({
  customerId,
  plans,
  currentPlanId,
  onClose,
}: {
  customerId: number;
  plans: Plan[];
  currentPlanId: number | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [planId, setPlanId] = useState(String(currentPlanId ?? plans[0]?.id ?? ""));
  const [endsAt, setEndsAt] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const assign = useMutation({
    mutationFn: () =>
      billingService.assignPlan(customerId, {
        plan_id: Number(planId),
        ends_at: endsAt || null,
        notes: notes || null,
      }),
    onSuccess: ({ message }) => {
      toast.success(message);
      void queryClient.invalidateQueries({
        queryKey: ["admin", "customers", customerId, "billing"],
      });
      void queryClient.invalidateQueries({ queryKey: ["admin", "subscriptions"] });
      onClose();
    },
    onError: (error) => {
      const apiError = toApiError(error);
      setErrors(
        Object.fromEntries(
          Object.entries(apiError.errors).map(([key, value]) => [key, value[0] ?? ""]),
        ),
      );
      if (!apiError.isValidation) toast.error(apiError.message);
    },
  });

  return (
    <Modal
      open
      onClose={onClose}
      title="Change plan"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={assign.isPending} onClick={() => assign.mutate()}>
            Assign plan
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          Assigns the plan without payment (e.g. invoiced contracts or goodwill). It replaces any
          current subscription; paid gateway subscriptions should be cancelled with the provider.
        </p>
        <Select
          label="Plan"
          value={planId}
          error={errors.plan_id}
          options={plans.map((plan) => ({ value: String(plan.id), label: plan.name }))}
          onChange={(event) => setPlanId(event.target.value)}
        />
        <Input
          label="Ends on (optional)"
          type="date"
          value={endsAt}
          error={errors.ends_at}
          hint="Leave empty to keep the plan until it's changed."
          onChange={(event) => setEndsAt(event.target.value)}
        />
        <Textarea
          label="Internal note (optional)"
          rows={3}
          maxLength={1000}
          value={notes}
          error={errors.notes}
          onChange={(event) => setNotes(event.target.value)}
        />
      </div>
    </Modal>
  );
}

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/components/layouts/page-header";
import {
  Badge,
  Button,
  Card,
  ErrorState,
  Input,
  Loading,
  Modal,
  Table,
  Textarea,
} from "@/components/ui";
import { FEATURE_LABELS, LIMIT_LABELS } from "@/features/billing/plan-cards";
import { toApiError } from "@/lib/api-error";
import { formatMoney } from "@/lib/format";
import { billingService, type PlanInput } from "@/services/billing.service";
import { toast } from "@/stores/toast.store";
import type { Plan, PlanFeatureKey, PlanLimitKey } from "@/types/billing";

const FEATURE_KEYS = Object.keys(FEATURE_LABELS) as PlanFeatureKey[];
const LIMIT_KEYS = Object.keys(LIMIT_LABELS) as PlanLimitKey[];

export function PlansManager() {
  const plans = useQuery({ queryKey: ["superadmin", "plans"], queryFn: billingService.plans });
  const [editing, setEditing] = useState<Plan | "new" | null>(null);

  return (
    <>
      <PageHeader
        title="Plans"
        description="Prices, features and limits. Changes apply to every customer on the plan immediately."
        actions={<Button onClick={() => setEditing("new")}>New plan</Button>}
      />
      <Card bodyClassName="p-0">
        {plans.isLoading ? (
          <Loading />
        ) : plans.error ? (
          <ErrorState error={plans.error} onRetry={() => void plans.refetch()} />
        ) : (
          <Table
            rows={plans.data}
            rowKey={(row) => row.id}
            columns={[
              {
                key: "name",
                header: "Plan",
                cell: (row) => (
                  <span>
                    <span className="font-medium text-slate-900">{row.name}</span>
                    <span className="block text-xs text-slate-500">{row.slug}</span>
                  </span>
                ),
              },
              {
                key: "monthly",
                header: "Monthly",
                cell: (row) =>
                  row.is_free ? "Free" : formatMoney(row.monthly_price, row.currency),
              },
              {
                key: "yearly",
                header: "Yearly",
                cell: (row) => (row.is_free ? "Free" : formatMoney(row.yearly_price, row.currency)),
              },
              {
                key: "trial",
                header: "Trial",
                cell: (row) => (row.trial_days ? `${row.trial_days} days` : "—"),
              },
              {
                key: "visibility",
                header: "Visibility",
                cell: (row) => (
                  <span className="flex gap-1">
                    {row.is_active ? <Badge tone="success">Active</Badge> : <Badge>Inactive</Badge>}
                    {row.is_public ? <Badge tone="brand">Public</Badge> : <Badge>Hidden</Badge>}
                  </span>
                ),
              },
              {
                key: "actions",
                header: "",
                className: "text-right",
                cell: (row) => (
                  <Button size="sm" variant="secondary" onClick={() => setEditing(row)}>
                    Edit
                  </Button>
                ),
              },
            ]}
          />
        )}
      </Card>
      {editing && (
        <PlanEditor plan={editing === "new" ? null : editing} onClose={() => setEditing(null)} />
      )}
    </>
  );
}

const toInput = (plan: Plan | null): PlanInput => ({
  slug: plan?.slug ?? "",
  name: plan?.name ?? "",
  description: plan?.description ?? null,
  monthly_price: plan?.monthly_price ?? null,
  yearly_price: plan?.yearly_price ?? null,
  trial_days: plan?.trial_days ?? 0,
  is_active: plan?.is_active ?? true,
  is_public: plan?.is_public ?? true,
  sort_order: plan?.sort_order ?? 100,
  gateway_prices: plan?.gateway_prices ?? {},
  features: Object.fromEntries(FEATURE_KEYS.map((key) => [key, plan?.features[key] ?? false])),
  limits: Object.fromEntries(LIMIT_KEYS.map((key) => [key, plan ? (plan.limits[key] ?? null) : 0])),
});

/** Major units in the form ("15.00"), minor units in the API (1500). */
const toMajor = (minor: number | null) => (minor === null ? "" : (minor / 100).toFixed(2));
const toMinor = (major: string) => (major.trim() === "" ? null : Math.round(Number(major) * 100));

function PlanEditor({ plan, onClose }: { plan: Plan | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<PlanInput>(() => toInput(plan));
  const [prices, setPrices] = useState({
    monthly: toMajor(form.monthly_price),
    yearly: toMajor(form.yearly_price),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = <K extends keyof PlanInput>(key: K, value: PlanInput[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const save = useMutation({
    mutationFn: () => {
      const input = {
        ...form,
        monthly_price: toMinor(prices.monthly),
        yearly_price: toMinor(prices.yearly),
      };
      return plan ? billingService.updatePlan(plan.id, input) : billingService.createPlan(input);
    },
    onSuccess: ({ message }) => {
      toast.success(message);
      void queryClient.invalidateQueries({ queryKey: ["superadmin", "plans"] });
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
      title={plan ? `Edit ${plan.name}` : "New plan"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={save.isPending} onClick={() => save.mutate()}>
            Save plan
          </Button>
        </>
      }
    >
      <div className="max-h-[65vh] space-y-5 overflow-y-auto pr-1">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Name"
            value={form.name}
            error={errors.name}
            onChange={(e) => set("name", e.target.value)}
          />
          <Input
            label="Slug"
            value={form.slug}
            error={errors.slug}
            hint="Lowercase letters, numbers and dashes."
            disabled={plan?.is_free}
            onChange={(e) => set("slug", e.target.value.toLowerCase())}
          />
        </div>
        <Textarea
          label="Description"
          rows={2}
          value={form.description ?? ""}
          error={errors.description}
          onChange={(e) => set("description", e.target.value || null)}
        />
        {!plan?.is_free && (
          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              label="Monthly price"
              type="number"
              min="0"
              step="0.01"
              value={prices.monthly}
              error={errors.monthly_price}
              hint="Empty = not sold monthly"
              onChange={(e) => setPrices((p) => ({ ...p, monthly: e.target.value }))}
            />
            <Input
              label="Yearly price"
              type="number"
              min="0"
              step="0.01"
              value={prices.yearly}
              error={errors.yearly_price}
              hint="Empty = not sold yearly"
              onChange={(e) => setPrices((p) => ({ ...p, yearly: e.target.value }))}
            />
            <Input
              label="Trial days"
              type="number"
              min="0"
              max="90"
              value={form.trial_days}
              error={errors.trial_days}
              onChange={(e) => set("trial_days", Number(e.target.value))}
            />
          </div>
        )}
        <div className="flex flex-wrap gap-6 text-sm text-slate-700">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              className="accent-brand-600 size-4"
              checked={form.is_active}
              disabled={plan?.is_free}
              onChange={(e) => set("is_active", e.target.checked)}
            />
            Active
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              className="accent-brand-600 size-4"
              checked={form.is_public}
              onChange={(e) => set("is_public", e.target.checked)}
            />
            Shown on pricing page
          </label>
          <div className="w-28">
            <Input
              label="Sort order"
              type="number"
              value={form.sort_order}
              onChange={(e) => set("sort_order", Number(e.target.value))}
            />
          </div>
        </div>

        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-slate-800">Features</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {FEATURE_KEYS.map((key) => (
              <label key={key} className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="accent-brand-600 size-4"
                  checked={Boolean(form.features[key])}
                  onChange={(e) => set("features", { ...form.features, [key]: e.target.checked })}
                />
                {FEATURE_LABELS[key]}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-slate-800">Limits</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {LIMIT_KEYS.map((key) => {
              const value = form.limits[key];
              return (
                <div key={key} className="space-y-1">
                  <Input
                    label={LIMIT_LABELS[key].replace(/^./, (c) => c.toUpperCase())}
                    type="number"
                    min="0"
                    value={value ?? ""}
                    placeholder="Unlimited"
                    disabled={value === null}
                    error={errors[`limits.${key}`]}
                    onChange={(e) =>
                      set("limits", {
                        ...form.limits,
                        [key]: e.target.value === "" ? 0 : Number(e.target.value),
                      })
                    }
                  />
                  <label className="flex items-center gap-2 text-xs text-slate-600">
                    <input
                      type="checkbox"
                      className="accent-brand-600 size-3.5"
                      checked={value === null}
                      onChange={(e) =>
                        set("limits", { ...form.limits, [key]: e.target.checked ? null : 0 })
                      }
                    />
                    Unlimited
                  </label>
                </div>
              );
            })}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-1 text-sm font-semibold text-slate-800">
            Gateway price IDs (optional)
          </legend>
          <p className="mb-2 text-xs text-slate-500">
            Stripe price IDs are optional (prices are sent inline otherwise). Razorpay needs a plan
            ID per interval.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {(["stripe", "razorpay"] as const).flatMap((gateway) =>
              (["month", "year"] as const).map((interval) => (
                <Input
                  key={`${gateway}-${interval}`}
                  label={`${gateway === "stripe" ? "Stripe" : "Razorpay"} · ${interval}ly`}
                  value={form.gateway_prices?.[gateway]?.[interval] ?? ""}
                  onChange={(e) =>
                    set("gateway_prices", {
                      ...form.gateway_prices,
                      [gateway]: {
                        ...form.gateway_prices?.[gateway],
                        [interval]: e.target.value || undefined,
                      },
                    })
                  }
                />
              )),
            )}
          </div>
        </fieldset>
      </div>
    </Modal>
  );
}

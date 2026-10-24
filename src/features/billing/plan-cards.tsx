import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/format";
import type { BillingInterval, Plan, PlanFeatureKey, PlanLimitKey } from "@/types/billing";

export const FEATURE_LABELS: Record<PlanFeatureKey, string> = {
  analytics: "Analytics",
  advanced_analytics: "Advanced analytics (90-day+ ranges)",
  reports: "PDF, CSV & Excel reports",
  ai_assistant: "AI writing assistant",
  content_library: "Content library",
  priority_support: "Priority support",
};

export const LIMIT_LABELS: Record<PlanLimitKey, string> = {
  social_accounts: "social accounts",
  posts_per_month: "posts / month",
  ai_requests_per_month: "AI requests / month",
  library_storage_mb: "MB library storage",
  report_exports_per_month: "report exports / month",
};

export interface PlanCardsProps {
  plans: Plan[];
  interval: BillingInterval;
  currentSlug: string | null;
  pendingSlug: string | null;
  onChoose: (plan: Plan) => void;
  onContact: () => void;
}

export function PlanCards({
  plans,
  interval,
  currentSlug,
  pendingSlug,
  onChoose,
  onContact,
}: PlanCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {plans.map((plan) => {
        const price = interval === "year" ? plan.yearly_price : plan.monthly_price;
        const current = plan.slug === currentSlug;

        return (
          <article
            key={plan.id}
            className={cn(
              "flex flex-col rounded-xl border bg-white p-5",
              current ? "border-brand-500 ring-brand-100 ring-2" : "border-slate-200",
            )}
          >
            <header>
              <h3 className="text-base font-semibold text-slate-900">{plan.name}</h3>
              {plan.description && (
                <p className="mt-1 text-sm text-slate-500">{plan.description}</p>
              )}
              <p className="mt-3 text-2xl font-bold text-slate-900">
                {plan.is_free
                  ? "Free"
                  : price === null
                    ? "Custom"
                    : formatMoney(price, plan.currency)}
                {!plan.is_free && price !== null && (
                  <span className="text-sm font-normal text-slate-500">
                    /{interval === "year" ? "year" : "month"}
                  </span>
                )}
              </p>
              {plan.trial_days > 0 && !current && (
                <p className="text-brand-700 mt-1 text-xs font-medium">
                  {plan.trial_days}-day free trial
                </p>
              )}
            </header>
            <ul className="mt-4 flex-1 space-y-1.5 text-sm text-slate-700">
              {(Object.keys(LIMIT_LABELS) as PlanLimitKey[]).map((key) =>
                key in plan.limits ? (
                  <li key={key}>
                    <span className="font-medium">
                      {plan.limits[key] === null ? "Unlimited" : plan.limits[key]?.toLocaleString()}
                    </span>{" "}
                    {LIMIT_LABELS[key]}
                  </li>
                ) : null,
              )}
              {(Object.keys(FEATURE_LABELS) as PlanFeatureKey[])
                .filter((key) => plan.features[key])
                .map((key) => (
                  <li key={key} className="text-slate-600">
                    <span aria-hidden="true" className="text-emerald-600">
                      ✓{" "}
                    </span>
                    {FEATURE_LABELS[key]}
                  </li>
                ))}
            </ul>
            <div className="mt-5">
              {current ? (
                <Button variant="secondary" className="w-full" disabled>
                  Current plan
                </Button>
              ) : plan.is_free ? null : plan.purchasable && price !== null ? (
                <Button
                  className="w-full"
                  loading={pendingSlug === plan.slug}
                  disabled={pendingSlug !== null}
                  onClick={() => onChoose(plan)}
                >
                  {currentSlug && currentSlug !== "free" ? "Switch" : "Upgrade"}
                </Button>
              ) : (
                <Button variant="secondary" className="w-full" onClick={onContact}>
                  Contact us
                </Button>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}

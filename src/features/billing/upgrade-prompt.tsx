"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button, Modal } from "@/components/ui";
import { ROUTES } from "@/constants/routes";
import type { ApiError } from "@/lib/api-error";

/**
 * Shown when an action is blocked by the customer's plan (HTTP 402 from the API).
 */
export function UpgradePrompt() {
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    const handler = (event: Event) => setError((event as CustomEvent<ApiError>).detail);
    window.addEventListener("plan:upgrade-required", handler);
    return () => window.removeEventListener("plan:upgrade-required", handler);
  }, []);

  return (
    <Modal
      open={error !== null}
      onClose={() => setError(null)}
      title={error?.upgrade?.reason === "limit_reached" ? "Plan limit reached" : "Upgrade needed"}
      footer={
        <>
          <Button variant="secondary" onClick={() => setError(null)}>
            Not now
          </Button>
          <Link
            href={ROUTES.customer.billing}
            onClick={() => setError(null)}
            className="bg-brand-600 hover:bg-brand-700 rounded-lg px-4 py-2 text-sm font-medium text-white"
          >
            See plans
          </Link>
        </>
      }
    >
      <p className="text-sm text-slate-600">{error?.message}</p>
    </Modal>
  );
}

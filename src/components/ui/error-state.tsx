import Link from "next/link";
import { toApiError } from "@/lib/api-error";
import { Button } from "./button";

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const apiError = toApiError(error);

  if (apiError.needsUpgrade) {
    return (
      <div role="alert" className="flex flex-col items-center gap-3 px-6 py-12 text-center">
        <p className="text-sm font-medium text-slate-800">{apiError.message}</p>
        <Link
          href="/billing"
          className="bg-brand-600 hover:bg-brand-700 rounded-lg px-4 py-2 text-sm font-medium text-white"
        >
          See plans
        </Link>
      </div>
    );
  }

  return (
    <div role="alert" className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <p className="text-sm font-medium text-red-700">{apiError.message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

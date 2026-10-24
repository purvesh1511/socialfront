import { AxiosError } from "axios";
import type { ApiEnvelope, ValidationErrors } from "@/types/api";

/** Sent with 402 responses when the customer's plan doesn't include a feature or limit. */
export interface UpgradeHint {
  reason: "feature_unavailable" | "limit_reached";
  key: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly errors: ValidationErrors = {},
    public readonly upgrade: UpgradeHint | null = null,
  ) {
    super(message);
    this.name = "ApiError";
  }

  get isValidation(): boolean {
    return this.status === 422 && Object.keys(this.errors).length > 0;
  }

  get needsUpgrade(): boolean {
    return this.status === 402;
  }
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  if (error instanceof AxiosError) {
    const body = error.response?.data as
      (Partial<ApiEnvelope<unknown>> & { upgrade?: UpgradeHint }) | undefined;
    return new ApiError(
      body?.message ?? (error.response ? "Request failed." : "Network error. Please try again."),
      error.response?.status ?? 0,
      body?.errors ?? {},
      body?.upgrade ?? null,
    );
  }

  return new ApiError("Something went wrong.", 0);
}

export function errorMessage(error: unknown): string {
  return toApiError(error).message;
}

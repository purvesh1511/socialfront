import { AxiosError, AxiosHeaders } from "axios";
import { describe, expect, it } from "vitest";
import { ApiError, toApiError } from "@/lib/api-error";

function axiosError(status: number, data: unknown): AxiosError {
  const headers = new AxiosHeaders();
  return new AxiosError("fail", "ERR", { headers }, null, {
    status,
    statusText: "",
    headers: {},
    config: { headers },
    data,
  });
}

describe("toApiError", () => {
  it("extracts message and validation errors from the API envelope", () => {
    const error = toApiError(
      axiosError(422, {
        success: false,
        message: "Validation failed.",
        data: null,
        errors: { email: ["Taken."] },
      }),
    );
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(422);
    expect(error.isValidation).toBe(true);
    expect(error.errors.email).toEqual(["Taken."]);
  });

  it("handles network failures", () => {
    const error = toApiError(new AxiosError("Network Error"));
    expect(error.status).toBe(0);
    expect(error.message).toBe("Network error. Please try again.");
  });

  it("carries the upgrade hint from 402 plan restrictions", () => {
    const error = toApiError(
      axiosError(402, {
        success: false,
        message: "Your plan allows 3 social accounts.",
        data: null,
        upgrade: { reason: "limit_reached", key: "social_accounts" },
      }),
    );
    expect(error.needsUpgrade).toBe(true);
    expect(error.upgrade).toEqual({ reason: "limit_reached", key: "social_accounts" });
  });
});

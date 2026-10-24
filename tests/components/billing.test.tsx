import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ErrorState } from "@/components/ui";
import { UsageMeters } from "@/features/billing/usage-meters";
import { ApiError } from "@/lib/api-error";
import { formatMoney } from "@/lib/format";

describe("formatMoney", () => {
  it("formats minor units in the given currency", () => {
    expect(formatMoney(1500, "USD")).toContain("15.00");
    expect(formatMoney(null, "USD")).toBe("—");
  });
});

describe("UsageMeters", () => {
  it("shows used / limit, unlimited rows and progress values", () => {
    render(
      <UsageMeters
        usage={[
          { key: "social_accounts", label: "Social accounts", limit: 3, used: 3 },
          { key: "posts_per_month", label: "Posts per month", limit: null, used: 12 },
          { key: "library_storage_mb", label: "Library storage", limit: 100, used: 40 },
        ]}
      />,
    );

    expect(screen.getByText("3 / 3")).toBeInTheDocument();
    expect(screen.getByText("12 · Unlimited")).toBeInTheDocument();
    expect(screen.getByText("40 MB / 100 MB")).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Social accounts" })).toHaveAttribute(
      "aria-valuenow",
      "3",
    );
  });
});

describe("ErrorState", () => {
  it("offers plans instead of retry for plan restrictions", () => {
    render(
      <ErrorState
        error={new ApiError("Reports are not included in your plan.", 402)}
        onRetry={() => undefined}
      />,
    );

    expect(screen.getByRole("link", { name: "See plans" })).toHaveAttribute("href", "/billing");
    expect(screen.queryByRole("button", { name: "Try again" })).not.toBeInTheDocument();
  });
});

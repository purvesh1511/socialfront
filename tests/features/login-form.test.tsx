import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LoginForm } from "@/features/auth/components/login-form";
import { ApiError } from "@/lib/api-error";
import { authService } from "@/services/auth.service";

const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, refresh: vi.fn(), push: vi.fn() }),
  useSearchParams: () => new URLSearchParams("next=/settings"),
}));

vi.mock("@/services/auth.service", () => ({
  authService: { login: vi.fn(), twoFactorChallenge: vi.fn() },
  needsTwoFactor: (result: { two_factor_required?: boolean }) =>
    Boolean(result.two_factor_required),
}));

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("LoginForm", () => {
  beforeEach(() => vi.clearAllMocks());

  it("validates input before calling the API", async () => {
    render(<LoginForm portal="customer" />, { wrapper });
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("Enter a valid email address.")).toBeInTheDocument();
    expect(authService.login).not.toHaveBeenCalled();
  });

  it("logs in and redirects to the requested page", async () => {
    vi.mocked(authService.login).mockResolvedValue({
      message: "Logged in successfully.",
      data: { user: { role: "customer" } as never },
    });
    render(<LoginForm portal="customer" />, { wrapper });

    await userEvent.type(screen.getByLabelText("Email"), "jane@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "secret-123");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/settings"));
    expect(authService.login).toHaveBeenCalledWith("customer", {
      email: "jane@example.com",
      password: "secret-123",
    });
  });

  it("shows server validation errors on the field", async () => {
    vi.mocked(authService.login).mockRejectedValue(
      new ApiError("Validation failed.", 422, {
        email: ["These credentials do not match our records."],
      }),
    );
    render(<LoginForm portal="admin" />, { wrapper });

    await userEvent.type(screen.getByLabelText("Email"), "jane@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "wrong");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(
      await screen.findByText("These credentials do not match our records."),
    ).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("asks for an authenticator code when two-factor authentication is on", async () => {
    vi.mocked(authService.login).mockResolvedValue({
      message: "Enter the code from your authenticator app.",
      data: { two_factor_required: true, challenge: "c".repeat(64) },
    });
    vi.mocked(authService.twoFactorChallenge).mockResolvedValue({
      message: "Logged in successfully.",
      data: { user: { role: "admin" } as never },
    });
    render(<LoginForm portal="admin" />, { wrapper });

    await userEvent.type(screen.getByLabelText("Email"), "admin@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "secret-123");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await userEvent.type(await screen.findByLabelText("Authentication code"), "123 456");
    await userEvent.click(screen.getByRole("button", { name: "Verify" }));

    await waitFor(() =>
      expect(authService.twoFactorChallenge).toHaveBeenCalledWith({
        challenge: "c".repeat(64),
        code: "123456",
      }),
    );
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/settings"));
  });
});

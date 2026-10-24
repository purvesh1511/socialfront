import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Pagination } from "@/components/ui";

describe("Pagination", () => {
  it("shows the range and navigates", async () => {
    const onPageChange = vi.fn();
    render(
      <Pagination
        meta={{ current_page: 2, last_page: 3, per_page: 10, total: 25 }}
        onPageChange={onPageChange}
      />,
    );

    expect(screen.getByText("Page 2 of 3")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(onPageChange).toHaveBeenCalledWith(3);
    await userEvent.click(screen.getByRole("button", { name: "Previous" }));
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it("disables previous on the first page", () => {
    render(
      <Pagination
        meta={{ current_page: 1, last_page: 1, per_page: 10, total: 3 }}
        onPageChange={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  });

  it("renders nothing without results", () => {
    const { container } = render(
      <Pagination
        meta={{ current_page: 1, last_page: 1, per_page: 10, total: 0 }}
        onPageChange={() => {}}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});

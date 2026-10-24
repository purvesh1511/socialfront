import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ApprovalThread } from "@/features/approvals/approval-thread";
import { SubmitForApprovalModal } from "@/features/approvals/submit-for-approval-modal";

describe("SubmitForApprovalModal", () => {
  it("defaults to the queue and submits", async () => {
    const onSubmit = vi.fn();
    render(<SubmitForApprovalModal open onClose={() => {}} onSubmit={onSubmit} />);

    expect(screen.getByLabelText("Add to the queue")).toBeChecked();
    await userEvent.click(screen.getByRole("button", { name: "Submit" }));

    expect(onSubmit).toHaveBeenCalledWith("queue", null);
  });

  it("requires a time when scheduling", async () => {
    const onSubmit = vi.fn();
    render(<SubmitForApprovalModal open onClose={() => {}} onSubmit={onSubmit} />);

    await userEvent.click(screen.getByLabelText("Schedule for a specific time"));
    await userEvent.click(screen.getByRole("button", { name: "Submit" }));

    expect(await screen.findByText("Choose when to publish.")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("preselects scheduling when the post already has a time", () => {
    render(
      <SubmitForApprovalModal
        open
        initialScheduledAt="2030-01-01T09:00:00Z"
        onClose={() => {}}
        onSubmit={() => {}}
      />,
    );

    expect(screen.getByLabelText("Schedule for a specific time")).toBeChecked();
    expect(screen.getByLabelText("Publish at")).not.toHaveValue("");
  });
});

describe("ApprovalThread", () => {
  const comments = [
    { id: 1, body: "Please add a link", user: "Admin", is_staff: true, created_at: null },
    { id: 2, body: "Done", user: "Jane", is_staff: false, created_at: null },
  ];

  it("shows comments with a reviewer badge", () => {
    render(<ApprovalThread comments={comments} />);

    expect(screen.getByText("Please add a link")).toBeInTheDocument();
    expect(screen.getAllByText("Reviewer")).toHaveLength(1);
    expect(screen.queryByRole("button", { name: "Comment" })).not.toBeInTheDocument();
  });

  it("posts a trimmed comment and clears the box", async () => {
    const onComment = vi.fn().mockResolvedValue(undefined);
    render(<ApprovalThread comments={[]} onComment={onComment} />);

    const box = screen.getByLabelText("Add a comment");
    await userEvent.type(box, "  Looks good  ");
    await userEvent.click(screen.getByRole("button", { name: "Comment" }));

    expect(onComment).toHaveBeenCalledWith("Looks good");
    await waitFor(() => expect(box).toHaveValue(""));
  });
});

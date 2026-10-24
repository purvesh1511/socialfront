import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PostPreview } from "@/features/posts/composer/post-preview";
import { RichText } from "@/features/posts/composer/rich-text";
import type { SocialAccount } from "@/types/social";

const account: SocialAccount = {
  id: 1,
  platform: { key: "linkedin", name: "LinkedIn" },
  name: "Acme Inc",
  username: "acme",
  avatar_url: null,
  account_type: "profile",
  status: "active",
  last_error: null,
  connected_at: null,
  is_disconnected: false,
};

describe("RichText", () => {
  it("highlights hashtags, mentions and links without interpreting HTML", () => {
    const { container } = render(
      <RichText text={'Hi @jane #launch https://acme.test <img src=x onerror="alert(1)">'} />,
    );
    expect(screen.getByText("#launch")).toHaveClass("text-brand-600");
    expect(screen.getByText("@jane")).toHaveClass("text-brand-600");
    expect(container.querySelector("img")).toBeNull();
  });
});

describe("PostPreview", () => {
  it("shows network, account, text and link domain", () => {
    render(
      <PostPreview account={account} text="Big news" media={[]} linkUrl="https://acme.test/blog" />,
    );
    expect(screen.getByText("LinkedIn")).toBeInTheDocument();
    expect(screen.getByText("Acme Inc")).toBeInTheDocument();
    expect(screen.getByText("Big news")).toBeInTheDocument();
    expect(screen.getByText("acme.test")).toBeInTheDocument();
  });

  it("shows a placeholder without text", () => {
    render(<PostPreview account={account} text="" media={[]} linkUrl="" />);
    expect(screen.getByText("Your text will appear here.")).toBeInTheDocument();
  });
});

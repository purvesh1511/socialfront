import type { Metadata } from "next";
import { PostsList } from "@/features/posts/posts-list";

export const metadata: Metadata = { title: "Pending approval" };

export default function Page() {
  return <PostsList tab="pending" />;
}

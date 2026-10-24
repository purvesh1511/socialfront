import type { Metadata } from "next";
import { PostsList } from "@/features/posts/posts-list";

export const metadata: Metadata = { title: "Failed posts" };

export default function Page() {
  return <PostsList tab="failed" />;
}

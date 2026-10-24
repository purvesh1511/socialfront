import type { Metadata } from "next";
import { PostsList } from "@/features/posts/posts-list";

export const metadata: Metadata = { title: "Posts" };

export default function Page() {
  return <PostsList tab="all" />;
}

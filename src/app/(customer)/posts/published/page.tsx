import type { Metadata } from "next";
import { PostsList } from "@/features/posts/posts-list";

export const metadata: Metadata = { title: "Published posts" };

export default function Page() {
  return <PostsList tab="published" />;
}

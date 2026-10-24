import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostDetail } from "@/features/posts/post-detail";

export const metadata: Metadata = { title: "Post" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();

  return <PostDetail id={id} />;
}

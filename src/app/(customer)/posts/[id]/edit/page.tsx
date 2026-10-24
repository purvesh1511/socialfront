import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RequirePermission } from "@/components/layouts/require-permission";
import { PERMISSIONS } from "@/constants/permissions";
import { EditPost } from "@/features/posts/edit-post";

export const metadata: Metadata = { title: "Edit post" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();

  return (
    <RequirePermission permission={PERMISSIONS.editPosts}>
      <EditPost id={id} />
    </RequirePermission>
  );
}

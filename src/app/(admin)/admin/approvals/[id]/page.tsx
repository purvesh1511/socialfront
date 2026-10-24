import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RequirePermission } from "@/components/layouts/require-permission";
import { PERMISSIONS } from "@/constants/permissions";
import { ApprovalReview } from "@/features/admin/approvals/approval-review";

export const metadata: Metadata = { title: "Review post" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();

  return (
    <RequirePermission permission={PERMISSIONS.approvePosts}>
      <ApprovalReview id={id} />
    </RequirePermission>
  );
}

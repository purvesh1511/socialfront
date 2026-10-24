import type { Metadata } from "next";
import { RequirePermission } from "@/components/layouts/require-permission";
import { PERMISSIONS } from "@/constants/permissions";
import { ApprovalsList } from "@/features/admin/approvals/approvals-list";

export const metadata: Metadata = { title: "Approvals" };

export default function Page() {
  return (
    <RequirePermission permission={PERMISSIONS.approvePosts}>
      <ApprovalsList />
    </RequirePermission>
  );
}

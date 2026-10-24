import type { Metadata } from "next";
import { RequirePermission } from "@/components/layouts/require-permission";
import { PERMISSIONS } from "@/constants/permissions";
import { AiUsage } from "@/features/superadmin/ai-usage";

export const metadata: Metadata = { title: "AI usage" };

export default function Page() {
  return (
    <RequirePermission permission={PERMISSIONS.viewSystemHealth}>
      <AiUsage />
    </RequirePermission>
  );
}

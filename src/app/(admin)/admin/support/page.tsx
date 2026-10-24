import type { Metadata } from "next";
import { Suspense } from "react";
import { RequirePermission } from "@/components/layouts/require-permission";
import { Loading } from "@/components/ui";
import { PERMISSIONS } from "@/constants/permissions";
import { SupportList } from "@/features/support/support-list";

export const metadata: Metadata = { title: "Support" };

export default function Page() {
  return (
    <RequirePermission permission={PERMISSIONS.manageSupport}>
      <Suspense fallback={<Loading />}>
        <SupportList scope="admin" />
      </Suspense>
    </RequirePermission>
  );
}

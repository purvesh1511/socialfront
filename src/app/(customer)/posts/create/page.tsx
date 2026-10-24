import type { Metadata } from "next";
import { Suspense } from "react";
import { RequirePermission } from "@/components/layouts/require-permission";
import { PERMISSIONS } from "@/constants/permissions";
import { Composer } from "@/features/posts/composer/composer";

export const metadata: Metadata = { title: "Create post" };

export default function Page() {
  return (
    <RequirePermission permission={PERMISSIONS.createPosts}>
      <Suspense>
        <Composer />
      </Suspense>
    </RequirePermission>
  );
}

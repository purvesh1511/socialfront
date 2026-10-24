import type { Metadata } from "next";
import { RequirePermission } from "@/components/layouts/require-permission";
import { PERMISSIONS } from "@/constants/permissions";
import { LibraryPage } from "@/features/library/library-page";

export const metadata: Metadata = { title: "Content library" };

export default function Page() {
  return (
    <RequirePermission permission={PERMISSIONS.manageContentLibrary}>
      <LibraryPage />
    </RequirePermission>
  );
}

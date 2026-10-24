import type { Metadata } from "next";
import { RequirePermission } from "@/components/layouts/require-permission";
import { PERMISSIONS } from "@/constants/permissions";
import { AiStudio } from "@/features/ai/ai-studio";

export const metadata: Metadata = { title: "AI Studio" };

export default function Page() {
  return (
    <RequirePermission permission={PERMISSIONS.useAi}>
      <AiStudio />
    </RequirePermission>
  );
}

import type { Metadata } from "next";
import { Suspense } from "react";
import { Loading } from "@/components/ui";
import { SupportList } from "@/features/support/support-list";

export const metadata: Metadata = { title: "Support" };

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <SupportList scope="customer" />
    </Suspense>
  );
}

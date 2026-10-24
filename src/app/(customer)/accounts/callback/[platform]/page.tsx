import type { Metadata } from "next";
import { Suspense } from "react";
import { OAuthCallback } from "@/features/social-accounts/oauth-callback";

export const metadata: Metadata = { title: "Connecting account" };

export default async function Page({ params }: { params: Promise<{ platform: string }> }) {
  const { platform } = await params;

  return (
    <Suspense>
      <OAuthCallback platform={platform} />
    </Suspense>
  );
}

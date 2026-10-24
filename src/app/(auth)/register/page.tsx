import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/layouts/auth-card";
import { ROUTES } from "@/constants/routes";
import { RegistrationGate } from "@/features/auth/components/registration-gate";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <AuthCard
      title="Create your account"
      subtitle="Start managing your social media in minutes."
      footer={
        <>
          Already have an account?{" "}
          <Link href={ROUTES.login} className="text-brand-600 hover:text-brand-700 font-medium">
            Sign in
          </Link>
        </>
      }
    >
      <RegistrationGate />
    </AuthCard>
  );
}

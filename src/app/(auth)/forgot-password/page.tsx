import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/layouts/auth-card";
import { ROUTES } from "@/constants/routes";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Forgot your password?"
      subtitle="Enter your email and we'll send you a reset link."
      footer={
        <Link href={ROUTES.login} className="text-brand-600 hover:text-brand-700 font-medium">
          ← Back to sign in
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}

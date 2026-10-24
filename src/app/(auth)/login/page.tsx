import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthCard } from "@/components/layouts/auth-card";
import { ROUTES } from "@/constants/routes";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <AuthCard
      title="Sign in"
      subtitle="Welcome back. Sign in to manage your social accounts."
      footer={
        <>
          New here?{" "}
          <Link href={ROUTES.register} className="text-brand-600 hover:text-brand-700 font-medium">
            Create an account
          </Link>
        </>
      }
    >
      <Suspense>
        <LoginForm portal="customer" />
      </Suspense>
    </AuthCard>
  );
}

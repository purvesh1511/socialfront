import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthCard } from "@/components/layouts/auth-card";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = { title: "Admin sign in" };

export default function AdminLoginPage() {
  return (
    <AuthCard title="Admin sign in" subtitle="Restricted to administrators.">
      <Suspense>
        <LoginForm portal="admin" />
      </Suspense>
    </AuthCard>
  );
}

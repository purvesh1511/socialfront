import Link from "next/link";
import { Logo } from "@/components/layouts/logo";
import { ROUTES } from "@/constants/routes";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 text-center">
      <Logo className="h-12" />
      <h1 className="mt-8 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
        Plan, schedule and grow your social presence.
      </h1>
      <p className="mt-4 text-lg text-slate-600">
        Connect your accounts, publish across networks and track what works — all from one
        dashboard.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href={ROUTES.register}
          className="bg-brand-600 hover:bg-brand-700 rounded-lg px-5 py-2.5 text-sm font-semibold text-white"
        >
          Get started
        </Link>
        <Link
          href={ROUTES.login}
          className="rounded-lg px-5 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-300 hover:bg-white"
        >
          Sign in
        </Link>
      </div>
    </main>
  );
}

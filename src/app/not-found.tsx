import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="text-brand-600 text-sm font-semibold">404</p>
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <Link href="/" className="text-brand-600 hover:text-brand-700 text-sm font-medium">
        Go home
      </Link>
    </main>
  );
}

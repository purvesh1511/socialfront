import Link from "next/link";

export function TwoFactorBanner({ profileHref }: { profileHref: string }) {
  return (
    <div
      role="status"
      className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
    >
      <span>Your organisation requires two-factor authentication for staff accounts.</span>
      <Link href={profileHref} className="font-semibold underline">
        Turn it on
      </Link>
    </div>
  );
}

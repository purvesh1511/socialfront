export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(value),
  );
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
}

/** "manage_customers" -> "Manage customers", "auth.logged_in" -> "Auth · logged in". */
export function humanize(value: string): string {
  const text = value.replace(/\./g, " · ").replace(/_/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Formats an amount in minor units (cents/paise), e.g. 1500 USD -> "$15.00". */
export function formatMoney(minor: number | null | undefined, currency: string): string {
  if (minor === null || minor === undefined) return "—";
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(minor / 100);
  } catch {
    return `${(minor / 100).toFixed(2)} ${currency}`;
  }
}

/** "2026-10-05" -> "Oct 5" (calendar date, not shifted by the viewer's timezone). */
export function formatShortDate(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

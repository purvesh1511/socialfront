const compact = new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 });
const whole = new Intl.NumberFormat();

export function formatCompact(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return Math.abs(value) < 10_000 ? whole.format(value) : compact.format(value);
}

export function formatNumber(value: number | null | undefined): string {
  return value === null || value === undefined ? "—" : whole.format(value);
}

export function formatSigned(value: number): string {
  return `${value > 0 ? "+" : value < 0 ? "−" : ""}${formatCompact(Math.abs(value))}`;
}

export function formatBytes(bytes: number | null | undefined): string {
  if (!bytes) return "—";
  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** exponent).toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

/** "Nice" axis ticks from 0 to just above `max` (about `count` ticks). */
export function niceTicks(max: number, count = 4): number[] {
  if (max <= 0) return [0, 1];
  const rough = max / count;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= rough) ?? rough;
  const top = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let value = 0; value <= top + step / 2; value += step)
    ticks.push(Math.round(value * 1e6) / 1e6);
  return ticks;
}

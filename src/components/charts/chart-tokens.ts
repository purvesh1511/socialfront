/**
 * Chart colour roles. Categorical slots follow the validated reference order (blue, orange, …);
 * the pair was checked against the white card surface (CVD ΔE 24.7, contrast ≥ 3:1).
 * Text never uses series colours.
 */
export const CHART = {
  series: ["#2a78d6", "#eb6834", "#1baf7a"],
  grid: "#e2e8f0",
  axis: "#94a3b8",
  textPrimary: "#0f172a",
  textSecondary: "#475569",
  surface: "#ffffff",
} as const;

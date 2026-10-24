"use client";

import { useMemo, useState, type KeyboardEvent, type PointerEvent } from "react";
import { formatCompact, niceTicks } from "@/lib/numbers";
import { CHART } from "./chart-tokens";
import { useElementWidth } from "./use-element-width";

export interface LineSeries {
  key: string;
  label: string;
  color: string;
}

interface LineChartProps<T> {
  data: T[];
  series: LineSeries[];
  x: (row: T) => string;
  y: (row: T, key: string) => number | null;
  formatX: (value: string) => string;
  formatValue?: (value: number) => string;
  ariaLabel: string;
  height?: number;
  area?: boolean;
}

const MARGIN = { top: 12, bottom: 28, left: 44 };
const LABEL_SPACE = 72;
const MAX_X_LABELS = 6;

/**
 * Time-series line chart (one shared y-scale). 2px lines, recessive grid, crosshair tooltip
 * on hover and arrow keys, legend for 2+ series plus labels at each line's end.
 */
export function LineChart<T>({
  data,
  series,
  x,
  y,
  formatX,
  formatValue = formatCompact,
  ariaLabel,
  height = 220,
  area = false,
}: LineChartProps<T>) {
  const { ref, width } = useElementWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);
  const multi = series.length > 1;
  const right = multi ? LABEL_SPACE : 16;
  const plotWidth = width - MARGIN.left - right;
  const plotHeight = height - MARGIN.top - MARGIN.bottom;

  const max = useMemo(
    () => Math.max(0, ...data.flatMap((row) => series.map((s) => y(row, s.key) ?? 0))),
    [data, series, y],
  );
  const ticks = niceTicks(max);
  const top = ticks[ticks.length - 1] || 1;
  const xAt = (index: number) =>
    MARGIN.left + (data.length <= 1 ? plotWidth / 2 : (index / (data.length - 1)) * plotWidth);
  const yAt = (value: number) => MARGIN.top + plotHeight - (value / top) * plotHeight;

  const paths = series.map((s) => {
    let line = "";
    let pen = false;
    data.forEach((row, index) => {
      const value = y(row, s.key);
      if (value === null) {
        pen = false;
        return;
      }
      line += `${pen ? "L" : "M"}${xAt(index).toFixed(1)},${yAt(value).toFixed(1)}`;
      pen = true;
    });
    const firstIndex = data.findIndex((row) => y(row, s.key) !== null);
    let lastIndex = -1;
    data.forEach((row, index) => {
      if (y(row, s.key) !== null) lastIndex = index;
    });
    const areaPath =
      area &&
      firstIndex >= 0 &&
      !data.slice(firstIndex, lastIndex + 1).some((row) => y(row, s.key) === null)
        ? `${line}L${xAt(lastIndex)},${yAt(0)}L${xAt(firstIndex)},${yAt(0)}Z`
        : null;
    return { ...s, line, areaPath, lastIndex };
  });

  const labelEvery = Math.max(1, Math.ceil(data.length / MAX_X_LABELS));

  const onPointerMove = (event: PointerEvent<SVGRectElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - bounds.left) / bounds.width;
    setActive(Math.max(0, Math.min(data.length - 1, Math.round(ratio * (data.length - 1)))));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight") setActive((i) => Math.min(data.length - 1, (i ?? -1) + 1));
    else if (event.key === "ArrowLeft") setActive((i) => Math.max(0, (i ?? data.length) - 1));
    else if (event.key === "Escape") setActive(null);
    else return;
    event.preventDefault();
  };

  const activeRow = active !== null ? data[active] : undefined;

  return (
    <div>
      {multi && (
        <ul className="mb-2 flex flex-wrap gap-4 text-xs text-slate-600" aria-label="Legend">
          {series.map((s) => (
            <li key={s.key} className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="inline-block h-0.5 w-4 rounded"
                style={{ backgroundColor: s.color }}
              />
              {s.label}
            </li>
          ))}
        </ul>
      )}
      <div
        ref={ref}
        className="focus-visible:ring-brand-500 relative focus:outline-none focus-visible:ring-2"
        tabIndex={0}
        role="img"
        aria-label={`${ariaLabel}. Use left and right arrow keys to read values.`}
        onKeyDown={onKeyDown}
        onBlur={() => setActive(null)}
      >
        <svg width={width} height={height} aria-hidden="true">
          {ticks.map((tick) => (
            <g key={tick}>
              <line
                x1={MARGIN.left}
                x2={width - right}
                y1={yAt(tick)}
                y2={yAt(tick)}
                stroke={CHART.grid}
                strokeWidth={1}
              />
              <text
                x={MARGIN.left - 8}
                y={yAt(tick)}
                dy="0.32em"
                textAnchor="end"
                fontSize={11}
                fill={CHART.textSecondary}
              >
                {formatValue(tick)}
              </text>
            </g>
          ))}
          {data.map((row, index) =>
            index % labelEvery === 0 || index === data.length - 1 ? (
              <text
                key={index}
                x={xAt(index)}
                y={height - 8}
                textAnchor="middle"
                fontSize={11}
                fill={CHART.textSecondary}
              >
                {formatX(x(row))}
              </text>
            ) : null,
          )}
          {paths.map((p) => (
            <g key={p.key}>
              {p.areaPath && <path d={p.areaPath} fill={p.color} fillOpacity={0.08} />}
              <path
                d={p.line}
                fill="none"
                stroke={p.color}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {multi && p.lastIndex >= 0 && (
                <text
                  x={xAt(p.lastIndex) + 6}
                  y={yAt(y(data[p.lastIndex] as T, p.key) ?? 0)}
                  dy="0.32em"
                  fontSize={11}
                  fill={CHART.textPrimary}
                >
                  {p.label}
                </text>
              )}
            </g>
          ))}
          {activeRow !== undefined && active !== null && (
            <g>
              <line
                x1={xAt(active)}
                x2={xAt(active)}
                y1={MARGIN.top}
                y2={MARGIN.top + plotHeight}
                stroke={CHART.axis}
                strokeWidth={1}
              />
              {series.map((s) => {
                const value = y(activeRow, s.key);
                return value === null ? null : (
                  <circle
                    key={s.key}
                    cx={xAt(active)}
                    cy={yAt(value)}
                    r={4}
                    fill={s.color}
                    stroke={CHART.surface}
                    strokeWidth={2}
                  />
                );
              })}
            </g>
          )}
          <rect
            x={MARGIN.left}
            y={MARGIN.top}
            width={Math.max(0, plotWidth)}
            height={plotHeight}
            fill="transparent"
            onPointerMove={onPointerMove}
            onPointerLeave={() => setActive(null)}
          />
        </svg>
        {activeRow !== undefined && active !== null && (
          <div
            role="status"
            className="pointer-events-none absolute top-1 z-10 min-w-32 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-md"
            style={{ left: Math.min(xAt(active) + 12, width - 150) }}
          >
            <p className="mb-1 font-semibold text-slate-900">{formatX(x(activeRow))}</p>
            {series.map((s) => (
              <p key={s.key} className="flex items-center justify-between gap-3 text-slate-600">
                <span className="flex items-center gap-1.5">
                  <span
                    aria-hidden="true"
                    className="inline-block size-2 rounded-full"
                    style={{ backgroundColor: s.color }}
                  />
                  {s.label}
                </span>
                <span className="font-medium text-slate-900 tabular-nums">
                  {y(activeRow, s.key)?.toLocaleString() ?? "—"}
                </span>
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

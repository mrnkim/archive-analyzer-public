import {
  Bar,
  Brush,
  CartesianGrid,
  Cell,
  ComposedChart,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TimelinePoint } from "../types/api";
import { pointKey, pointLabel } from "../lib/period";
import { InfoIcon, Tooltip as InfoTooltip, TooltipTrigger, TooltipContent } from "@twelvelabs-io/react";

// TLDS chart palette. recharts writes these as SVG `fill`/`stroke` *attributes*,
// where CSS var() does not resolve — so we mirror the exact --tl-color-* token
// hex values (single source: @twelvelabs-io/react tokens.css). Keep in lockstep;
// a later pass can resolve them from CSS custom properties at runtime.
const CHART = {
  accent: "#60e21b", // --tl-color-embed-green
  accentSoft: "#bff3a4", // --tl-color-embed-light-green
  grid: "#e2e2e2", // --tl-color-gray-200
  axis: "#8f8984", // --tl-color-gray-500 (foreground-subtle)
  axisLine: "#d3d1cf", // --tl-color-gray-300 (border-secondary)
  peakLabel: "#1d1c1b", // --tl-color-gray-700 (foreground-body)
  brushFill: "#ffffff", // --tl-color-white (surface-white)
  boundary: "#8f8984", // --tl-color-gray-500 (foreground-subtle) — naming line
} as const;

// Chart datum = a timeline point plus a numeric x key (`_k`) and its human
// label (`_label`). Month-level points (COVID tab) get distinct keys per month;
// year-only points collapse to the plain year, so year tabs are unchanged.
type ChartDatum = TimelinePoint & { _k: number; _label: string };

type Props = {
  data: TimelinePoint[];
  onPointClick: (point: TimelinePoint) => void;
};

type TooltipPayload = {
  payload: ChartDatum;
};

function EvidencePointTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  const sceneLabel = `${point.frequency} scene${point.frequency === 1 ? "" : "s"}`;

  return (
    <div className="bg-surface-white border border-border-secondary rounded-nav-item shadow-lg w-64 px-3 py-2 pointer-events-none">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-semibold text-foreground-body tabular-nums">
          {point._label}
        </div>
        <div className="text-[11px] font-medium text-foreground-subtle">
          {sceneLabel}
        </div>
      </div>
      <div className="mt-1 text-xs text-foreground-muted leading-snug">
        {point.dominant_theme}
      </div>
      {point.pre_terminology && (
        <div className="mt-1 text-[10px] font-medium text-foreground-status-warning">
          Before it was named “COVID-19”
        </div>
      )}
      <div className="mt-2 text-[10px] uppercase tracking-wider text-foreground-subtle">
        Click to inspect evidence
      </div>
    </div>
  );
}

export function TimelineChart({ data, onPointClick }: Props) {
  const chartData: ChartDatum[] = data.map((p) => ({
    ...p,
    _k: pointKey(p),
    _label: pointLabel(p),
  }));
  const labelByKey = new Map(chartData.map((d) => [d._k, d._label]));
  const peakDatum = chartData.reduce(
    (max, p) => (p.frequency > max.frequency ? p : max),
    chartData[0]
  );
  const totalScenes = chartData.reduce((sum, p) => sum + p.frequency, 0);
  const isMonthly = data.some((p) => p.month != null);
  const unit = isMonthly ? "months" : "years";
  const fmtTick = (v: number) => labelByKey.get(v) ?? String(v);
  // COVID tab only: the first month that is NOT pre-terminology marks where the
  // disease got its official name. Rendered as a boundary line so the eye reads
  // everything to its left as pre-naming discovery. Undefined (→ no line) unless
  // the data actually spans the pre/post-naming split, so year tabs are unchanged.
  const namingDatum =
    isMonthly && chartData.some((p) => p.pre_terminology)
      ? chartData.slice().sort((a, b) => a._k - b._k).find((p) => !p.pre_terminology)
      : undefined;

  return (
    <div className="bg-surface-white border border-border-secondary rounded-tlds-3 p-4">
      <div className="flex items-baseline justify-between mb-3 gap-3">
        <h3 className="text-sm font-medium text-foreground-muted">
          Evidence timeline
          <InfoTooltip>
            <TooltipTrigger asChild>
              <span className="ml-1 inline-flex cursor-help align-[-1px]">
                <InfoIcon className="w-3 h-3 text-foreground-subtle" />
              </span>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              Each scene = a distinct moment surfaced in the corpus. One video can
              contribute multiple scenes.
            </TooltipContent>
          </InfoTooltip>
        </h3>
        <span className="text-xs text-foreground-subtle">
          {totalScenes} scenes across {chartData.length} {unit} · peak: {peakDatum._label}
        </span>
      </div>
      {isMonthly && (
        <p className="-mt-1 mb-3 text-xs text-foreground-subtle">
          Matched by meaning — these scenes were surfaced without the term “COVID-19”.
        </p>
      )}
      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart
          data={chartData}
          onClick={(e) => {
            if (e?.activePayload?.[0]?.payload) {
              onPointClick(e.activePayload[0].payload as TimelinePoint);
            }
          }}
          margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
        >
          {/* Colors sourced from the CHART palette (mirrors --tl-color-* tokens). */}
          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke={CHART.grid} />
          <XAxis
            dataKey="_k"
            type="category"
            tickFormatter={fmtTick}
            stroke={CHART.axis}
            tick={{ fontSize: 12 }}
            axisLine={{ stroke: CHART.axisLine }}
            tickLine={false}
          />
          <YAxis
            stroke={CHART.axis}
            tick={{ fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            content={<EvidencePointTooltip />}
            cursor={{ stroke: CHART.axisLine, strokeDasharray: "3 3" }}
          />
          <Bar
            dataKey="frequency"
            barSize={8}
            radius={[999, 999, 0, 0]}
            cursor="pointer"
          >
            {chartData.map((p) => (
              <Cell
                key={`bar-${p._k}`}
                fill={p._k === peakDatum._k ? CHART.accent : CHART.accentSoft}
                stroke={CHART.accent}
                strokeWidth={1}
              />
            ))}
          </Bar>
          <Scatter dataKey="frequency" cursor="pointer">
            {chartData.map((p) => (
              <Cell
                key={`dot-${p._k}`}
                fill={CHART.accent}
                stroke={CHART.accent}
                strokeWidth={1}
              />
            ))}
          </Scatter>
          {namingDatum && (
            <ReferenceLine
              x={namingDatum._k}
              stroke={CHART.boundary}
              strokeDasharray="4 3"
              label={{
                value: "named “COVID-19”",
                position: "insideTopRight",
                fill: CHART.boundary,
                fontSize: 10,
                fontWeight: 600,
              }}
            />
          )}
          <ReferenceDot
            x={peakDatum._k}
            y={peakDatum.frequency}
            r={0}
            label={{
              value: "peak",
              position: "top",
              fill: CHART.peakLabel,
              fontSize: 11,
              fontWeight: 600,
            }}
          />
          <Brush
            dataKey="_k"
            height={24}
            stroke={CHART.accent}
            fill={CHART.brushFill}
            travellerWidth={8}
            tickFormatter={fmtTick}
          />
        </ComposedChart>
      </ResponsiveContainer>
      <p className="text-xs text-foreground-subtle mt-2">
        Tip: click a marker to load its scenes. Bars show discrete evidence
        volume; dots are the selectable anchors.
      </p>
    </div>
  );
}

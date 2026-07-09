import {
  Bar,
  Brush,
  CartesianGrid,
  Cell,
  ComposedChart,
  ReferenceDot,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TimelinePoint } from "../types/api";
import { Icon } from "./Icon";

// TLDS chart palette. recharts writes these as SVG `fill`/`stroke` *attributes*,
// where CSS var() does not resolve — so we mirror the exact --tl-color-* token
// hex values (single source: src/tokens.css). Keep in lockstep with the tokens;
// a later pass can resolve them from CSS custom properties at runtime.
const CHART = {
  accent: "#60e21b", // --tl-color-embed-green
  accentSoft: "#bff3a4", // --tl-color-embed-light-green
  grid: "#e2e2e2", // --tl-color-gray-200
  axis: "#8f8984", // --tl-color-gray-500 (foreground-subtle)
  axisLine: "#d3d1cf", // --tl-color-gray-300 (border-secondary)
  peakLabel: "#1d1c1b", // --tl-color-gray-700 (foreground-body)
  brushFill: "#ffffff", // --tl-color-white (surface-white)
} as const;

type Props = {
  data: TimelinePoint[];
  onPointClick: (point: TimelinePoint) => void;
};

type TooltipPayload = {
  payload: TimelinePoint;
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
          {point.year}
        </div>
        <div className="text-[11px] font-medium text-foreground-subtle">
          {sceneLabel}
        </div>
      </div>
      <div className="mt-1 text-xs text-foreground-muted leading-snug">
        {point.dominant_theme}
      </div>
      <div className="mt-2 text-[10px] uppercase tracking-wider text-foreground-subtle">
        Click to inspect evidence
      </div>
    </div>
  );
}

export function TimelineChart({ data, onPointClick }: Props) {
  const peakPoint = data.reduce(
    (max, p) => (p.frequency > max.frequency ? p : max),
    data[0]
  );
  const totalScenes = data.reduce((sum, p) => sum + p.frequency, 0);

  return (
    <div className="bg-surface-white border border-border-secondary rounded-tlds-3 p-4">
      <div className="flex items-baseline justify-between mb-3 gap-3">
        <h3
          className="text-sm font-medium text-foreground-muted"
          title="Each scene = a distinct moment where adidas is visually present in the corpus. One video can contribute multiple scenes."
        >
          Evidence timeline
          <Icon name="info" className="inline-block w-3 h-3 ml-1 text-foreground-subtle cursor-help align-[-1px]" />
        </h3>
        <span className="text-xs text-foreground-subtle">
          {totalScenes} scenes across {data.length} years · peak: {peakPoint.year}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart
          data={data}
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
            dataKey="year"
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
            {data.map((p) => (
              <Cell
                key={`bar-${p.year}`}
                fill={p.year === peakPoint.year ? CHART.accent : CHART.accentSoft}
                stroke={CHART.accent}
                strokeWidth={1}
              />
            ))}
          </Bar>
          <Scatter dataKey="frequency" cursor="pointer">
            {data.map((p) => (
              <Cell
                key={`dot-${p.year}`}
                fill={CHART.accent}
                stroke={CHART.accent}
                strokeWidth={1}
              />
            ))}
          </Scatter>
          <ReferenceDot
            x={peakPoint.year}
            y={peakPoint.frequency}
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
            dataKey="year"
            height={24}
            stroke={CHART.accent}
            fill={CHART.brushFill}
            travellerWidth={8}
          />
        </ComposedChart>
      </ResponsiveContainer>
      <p className="text-xs text-foreground-subtle mt-2">
        Tip: click a year marker to load its scenes. Bars show discrete evidence
        volume; dots are the selectable yearly anchors.
      </p>
    </div>
  );
}

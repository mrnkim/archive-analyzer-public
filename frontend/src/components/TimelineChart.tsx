import {
  Brush,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TimelinePoint } from "../types/api";
import { Icon } from "./Icon";

type Props = {
  data: TimelinePoint[];
  onPointClick: (point: TimelinePoint) => void;
};

type TooltipPayload = {
  payload: TimelinePoint;
};

function ClipPreviewTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  const clip = point.representative_clip;
  const sceneLabel = `${point.frequency} scene${point.frequency === 1 ? "" : "s"}`;

  return (
    <div className="bg-neutral-950/95 border border-neutral-700 rounded-md shadow-xl overflow-hidden w-56 pointer-events-none">
      <div className="aspect-video bg-neutral-800 relative">
        {clip.thumbnail_url ? (
          <img
            src={clip.thumbnail_url}
            alt={clip.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[10px] text-neutral-600">
            no thumbnail
          </div>
        )}
        <div className="absolute top-1 left-1 bg-black/70 text-white text-[11px] font-semibold tabular-nums rounded px-1.5 py-0.5">
          {point.year}
        </div>
      </div>
      <div className="px-2.5 py-2 space-y-1">
        <div className="text-[11px] text-neutral-200 font-medium line-clamp-1">
          {clip.title}
        </div>
        <div className="text-[10px] text-neutral-400 line-clamp-1">
          {sceneLabel} · {point.dominant_theme}
        </div>
      </div>
    </div>
  );
}

export function TimelineChart({ data, onPointClick }: Props) {
  const peakPoint = data.reduce(
    (max, p) => (p.frequency > max.frequency ? p : max),
    data[0]
  );

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
      <div className="flex items-baseline justify-between mb-3 gap-3">
        <h3
          className="text-sm font-medium text-neutral-300"
          title="Each scene = a distinct moment where adidas is visually present in the corpus. One video can contribute multiple scenes."
        >
          Scenes per year
          <Icon name="info" className="inline-block w-3 h-3 ml-1 text-neutral-500 cursor-help align-[-1px]" />
        </h3>
        <span className="text-xs text-neutral-500">
          peak: {peakPoint.year} ({peakPoint.frequency} scenes) — {peakPoint.dominant_theme}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart
          data={data}
          onClick={(e) => {
            if (e?.activePayload?.[0]?.payload) {
              onPointClick(e.activePayload[0].payload as TimelinePoint);
            }
          }}
          margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
        >
          {/* Strand dark tokens: border #333231, text-tertiary #6B6966,
              accent #00DC82, highlight #60E21B, bg #1D1C1B. */}
          <CartesianGrid strokeDasharray="3 3" stroke="#333231" />
          <XAxis
            dataKey="year"
            stroke="#6B6966"
            tick={{ fontSize: 12 }}
          />
          <YAxis stroke="#6B6966" tick={{ fontSize: 12 }} />
          <Tooltip
            content={<ClipPreviewTooltip />}
            cursor={{ stroke: "#45423F", strokeDasharray: "3 3" }}
          />
          <Line
            type="monotone"
            dataKey="frequency"
            stroke="#00DC82"
            strokeWidth={2}
            dot={{ r: 3, fill: "#00DC82", cursor: "pointer" }}
            activeDot={{ r: 6, fill: "#60E21B" }}
          />
          <ReferenceDot
            x={peakPoint.year}
            y={peakPoint.frequency}
            r={8}
            fill="#60E21B"
            stroke="#00DC82"
            strokeWidth={2}
          />
          <Brush
            dataKey="year"
            height={24}
            stroke="#00DC82"
            fill="#1D1C1B"
            travellerWidth={8}
          />
        </LineChart>
      </ResponsiveContainer>
      <p className="text-xs text-neutral-500 mt-2">
        Tip: click a data point to load the representative clip for that year.
        A scene is one visual moment where adidas appears — a single video can contribute multiple scenes.
      </p>
    </div>
  );
}

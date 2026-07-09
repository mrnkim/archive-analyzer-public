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
    <div className="bg-neutral-900/95 border border-neutral-700 rounded-md shadow-xl overflow-hidden w-56 pointer-events-none">
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
        <div className="text-[10px] text-neutral-500 line-clamp-1">
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
  const totalScenes = data.reduce((sum, p) => sum + p.frequency, 0);

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
      <div className="flex items-baseline justify-between mb-3 gap-3">
        <h3
          className="text-sm font-medium text-neutral-300"
          title="Each scene = a distinct moment where adidas is visually present in the corpus. One video can contribute multiple scenes."
        >
          Evidence timeline
          <Icon name="info" className="inline-block w-3 h-3 ml-1 text-neutral-500 cursor-help align-[-1px]" />
        </h3>
        <span className="text-xs text-neutral-500">
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
          {/* Strand light tokens: border #E8E7E5, text-secondary #6B6966,
              accent #60E21C, accent-light #BFF3A4, bg #F4F3F3. */}
          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#E8E7E5" />
          <XAxis
            dataKey="year"
            stroke="#6B6966"
            tick={{ fontSize: 12 }}
            axisLine={{ stroke: "#D3D1CF" }}
            tickLine={false}
          />
          <YAxis
            stroke="#6B6966"
            tick={{ fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            content={<ClipPreviewTooltip />}
            cursor={{ stroke: "#D3D1CF", strokeDasharray: "3 3" }}
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
                fill={p.year === peakPoint.year ? "#60E21C" : "#BFF3A4"}
                stroke="#60E21C"
                strokeWidth={1}
              />
            ))}
          </Bar>
          <Scatter dataKey="frequency" cursor="pointer">
            {data.map((p) => (
              <Cell
                key={`dot-${p.year}`}
                fill="#60E21C"
                stroke={p.year === peakPoint.year ? "#1D1C1B" : "#60E21C"}
                strokeWidth={p.year === peakPoint.year ? 2 : 1}
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
              fill: "#1D1C1B",
              fontSize: 11,
              fontWeight: 600,
            }}
          />
          <Brush
            dataKey="year"
            height={24}
            stroke="#60E21C"
            fill="#FFFFFF"
            travellerWidth={8}
          />
        </ComposedChart>
      </ResponsiveContainer>
      <p className="text-xs text-neutral-500 mt-2">
        Tip: click a year marker to load its scenes. Bars show discrete evidence
        volume; dots are the selectable yearly anchors.
      </p>
    </div>
  );
}

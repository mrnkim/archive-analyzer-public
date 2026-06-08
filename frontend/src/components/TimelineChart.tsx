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

type Props = {
  data: TimelinePoint[];
  onPointClick: (point: TimelinePoint) => void;
};

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
          <span className="text-neutral-500 ml-1 cursor-help">ⓘ</span>
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
          <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
          <XAxis
            dataKey="year"
            stroke="#737373"
            tick={{ fontSize: 12 }}
          />
          <YAxis stroke="#737373" tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0a0a0a",
              border: "1px solid #404040",
              borderRadius: "6px",
              fontSize: "12px",
            }}
            labelStyle={{ color: "#d4d4d4" }}
            formatter={(value: number, _name, props) => {
              const theme = props.payload?.dominant_theme;
              return [`${value} scene${value === 1 ? "" : "s"} · ${theme}`, "Frequency"];
            }}
          />
          <Line
            type="monotone"
            dataKey="frequency"
            stroke="#22c55e"
            strokeWidth={2}
            dot={{ r: 3, fill: "#22c55e", cursor: "pointer" }}
            activeDot={{ r: 6, fill: "#86efac" }}
          />
          <ReferenceDot
            x={peakPoint.year}
            y={peakPoint.frequency}
            r={8}
            fill="#86efac"
            stroke="#22c55e"
            strokeWidth={2}
          />
          <Brush
            dataKey="year"
            height={24}
            stroke="#22c55e"
            fill="#171717"
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

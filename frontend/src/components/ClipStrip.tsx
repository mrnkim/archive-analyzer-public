import { ExportButton } from "./ExportButton";
import type { TimelinePoint } from "../types/api";

type Props = {
  timeline: TimelinePoint[];
  selectedYear: number | null;
  onSelect: (point: TimelinePoint) => void;
  exportQuery?: string;
  exportScenario?: string;
};

export function ClipStrip({
  timeline,
  selectedYear,
  onSelect,
  exportQuery,
  exportScenario,
}: Props) {
  if (!timeline.length) return null;

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
      <div className="flex items-baseline justify-between mb-3 gap-3">
        <h3 className="text-sm font-medium text-neutral-300">
          All representative clips
          <span className="text-xs text-neutral-500 ml-2">({timeline.length})</span>
        </h3>
        <div className="flex items-center gap-3">
          <span className="text-xs text-neutral-500 hidden sm:inline">
            click any to focus
          </span>
          {exportQuery && (
            <ExportButton query={exportQuery} scenario={exportScenario} />
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2">
        {timeline.map((p) => {
          const c = p.representative_clip;
          const selected = p.year === selectedYear;
          return (
            <button
              key={`${p.year}-${c.asset_id}`}
              onClick={() => onSelect(p)}
              className={`group relative aspect-video rounded-xl overflow-hidden border-2 transition-all text-left ${
                selected
                  ? "selected-panel-attention border-neutral-50 ring-2 ring-neutral-50/20"
                  : "border-neutral-700 hover:border-neutral-500"
              }`}
              title={`${c.title} · ${p.frequency} scene${p.frequency === 1 ? "" : "s"}`}
            >
              {c.thumbnail_url ? (
                <img
                  src={c.thumbnail_url}
                  alt={c.title}
                  className={`w-full h-full object-cover transition-opacity ${
                    selected ? "opacity-100" : "opacity-80 group-hover:opacity-100"
                  }`}
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full bg-neutral-800 flex items-center justify-center text-[10px] text-neutral-600">
                  no thumbnail
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent px-1.5 py-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[11px] font-semibold text-white tabular-nums">
                    {p.year}
                  </span>
                  <span className="text-[9px] text-neutral-200 bg-black/40 rounded px-1">
                    {p.frequency}×
                  </span>
                </div>
              </div>
              {selected && (
                <div className="absolute top-1 right-1 w-2 h-2 bg-neutral-50 rounded-full shadow-lg" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

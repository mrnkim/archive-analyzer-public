import { HlsClipPlayer } from "./HlsClipPlayer";
import type { TimelinePoint } from "../types/api";

type Props = {
  point: TimelinePoint | null;
};

export function ClipGrid({ point }: Props) {
  if (!point) {
    return (
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 text-center text-sm text-neutral-500">
        Select a data point on the timeline or in the strip above to see clips.
      </div>
    );
  }

  const clip = point.representative_clip;
  const clipDuration = clip.timestamp_end - clip.timestamp_start;

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-sm font-medium text-neutral-300">
          Representative clip — {point.year}
        </h3>
        <span
          className="text-xs text-neutral-500"
          title="Distinct visual moments where adidas appears in this year's clip(s)"
        >
          {point.frequency} scene{point.frequency === 1 ? "" : "s"}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {clip.manifest_url ? (
          <HlsClipPlayer
            manifestUrl={clip.manifest_url}
            thumbnailUrl={clip.thumbnail_url}
            title={clip.title}
            startSec={clip.timestamp_start}
            endSec={clip.timestamp_end}
          />
        ) : clip.thumbnail_url ? (
          <div className="aspect-video bg-neutral-800 rounded-md overflow-hidden border border-neutral-700">
            <img
              src={clip.thumbnail_url}
              alt={clip.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="aspect-video bg-neutral-800 rounded-md flex items-center justify-center border border-neutral-700 text-xs text-neutral-600">
            No thumbnail available
          </div>
        )}

        <div className="space-y-2">
          <div className="text-base font-medium text-neutral-100">{clip.title}</div>
          <div className="text-xs text-neutral-400">
            Theme: <span className="text-brand-500">{point.dominant_theme}</span>
          </div>
          <div className="text-xs text-neutral-500">
            asset_id: <code className="text-neutral-400">{clip.asset_id}</code>
          </div>
          <div className="text-xs text-neutral-500">
            Range: {clip.timestamp_start.toFixed(1)}s – {clip.timestamp_end.toFixed(1)}s
            <span className="ml-2 text-neutral-600">
              ({clipDuration.toFixed(1)}s clip)
            </span>
            {clip.duration && (
              <span className="ml-2 text-neutral-600">
                · full asset {clip.duration.toFixed(0)}s
              </span>
            )}
          </div>
          {clip.manifest_url && (
            <a
              href={clip.manifest_url}
              target="_blank"
              rel="noopener"
              className="inline-block text-xs text-brand-500 hover:underline"
            >
              ↗ Open HLS stream in browser
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

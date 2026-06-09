import { HlsClipPlayer } from "./HlsClipPlayer";
import type { Scene, TimelinePoint } from "../types/api";

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

  // Use the full scenes list when present (new backend), otherwise fall back
  // to the single representative clip (older primed JSON snapshots).
  const scenes: Scene[] =
    point.scenes && point.scenes.length > 0
      ? point.scenes
      : [point.representative_clip];

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-sm font-medium text-neutral-300">
          Scenes — {point.year}
        </h3>
        <span
          className="text-xs text-neutral-500"
          title="Distinct visual moments where the entity appears this year"
        >
          {scenes.length} of {point.frequency}
        </span>
      </div>

      {point.dominant_theme && (
        <div className="text-xs text-neutral-400 mb-3">
          Theme: <span className="text-brand-500">{point.dominant_theme}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {scenes.map((scene, i) => (
          <SceneCard key={`${scene.asset_id}-${scene.timestamp_start}-${i}`} scene={scene} rank={i} />
        ))}
      </div>
    </div>
  );
}

function SceneCard({ scene, rank }: { scene: Scene; rank: number }) {
  const duration = scene.timestamp_end - scene.timestamp_start;
  // Strand "Video Thumbnail" pattern: 20px-radius media with a timecode chip,
  // title + meta below the card (no surrounding box).
  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        {scene.manifest_url ? (
          <HlsClipPlayer
            manifestUrl={scene.manifest_url}
            thumbnailUrl={scene.thumbnail_url}
            title={scene.title}
            startSec={scene.timestamp_start}
            endSec={scene.timestamp_end}
          />
        ) : scene.thumbnail_url ? (
          <div className="aspect-video bg-neutral-800 rounded-[20px] overflow-hidden border border-neutral-800">
            <img
              src={scene.thumbnail_url}
              alt={scene.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="aspect-video bg-neutral-800 rounded-[20px] overflow-hidden border border-neutral-800 flex items-center justify-center text-xs text-neutral-600">
            No thumbnail
          </div>
        )}
        {/* Strand video chip — rank */}
        <span className="pointer-events-none absolute top-2.5 left-2.5 backdrop-blur-[20px] bg-white/[0.08] border border-white/60 text-white text-[10px] font-medium px-1.5 py-0.5 rounded-md tabular-nums">
          #{rank + 1}
        </span>
        {scene.score != null && (
          <span
            className="pointer-events-none absolute top-2.5 right-2.5 backdrop-blur-[20px] bg-white/[0.08] border border-white/60 text-brand-500 text-[10px] font-medium px-1.5 py-0.5 rounded-md tabular-nums"
            title="Marengo relevance score"
          >
            {scene.score.toFixed(2)}
          </span>
        )}
        {/* Strand video chip — timecode (IBM Plex Mono), bottom overlay */}
        <span className="pointer-events-none absolute bottom-2.5 left-2.5 backdrop-blur-[20px] bg-white/[0.08] border border-white/60 text-white text-[10px] font-mono px-1.5 py-0.5 rounded-md">
          {scene.timestamp_start.toFixed(1)}s – {scene.timestamp_end.toFixed(1)}s
        </span>
      </div>
      <div className="px-0.5 text-xs space-y-1">
        <div className="text-neutral-100 truncate" title={scene.title}>
          {scene.title || "(no title)"}
        </div>
        <div className="text-neutral-600 font-mono text-[11px]">
          {duration.toFixed(1)}s clip
        </div>
        {scene.reason && (
          <div
            className="text-neutral-300 leading-snug pt-0.5"
            title="Why this scene was selected"
          >
            <span className="text-brand-500 font-medium">Why: </span>
            {scene.reason}
          </div>
        )}
      </div>
    </div>
  );
}

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
  return (
    <div className="bg-neutral-950 border border-neutral-800 rounded-md overflow-hidden flex flex-col">
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
          <div className="aspect-video bg-neutral-800">
            <img
              src={scene.thumbnail_url}
              alt={scene.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="aspect-video bg-neutral-800 flex items-center justify-center text-xs text-neutral-600">
            No thumbnail
          </div>
        )}
        <span className="absolute top-1.5 left-1.5 bg-black/70 backdrop-blur-sm text-[10px] font-medium text-neutral-100 px-1.5 py-0.5 rounded">
          #{rank + 1}
        </span>
        {scene.score != null && (
          <span
            className="absolute top-1.5 right-1.5 bg-black/70 backdrop-blur-sm text-[10px] font-medium text-brand-500 px-1.5 py-0.5 rounded"
            title="Marengo relevance score"
          >
            {scene.score.toFixed(2)}
          </span>
        )}
      </div>
      <div className="p-2.5 text-xs space-y-1">
        <div className="text-neutral-200 truncate" title={scene.title}>
          {scene.title || "(no title)"}
        </div>
        <div className="text-neutral-500">
          {scene.timestamp_start.toFixed(1)}s – {scene.timestamp_end.toFixed(1)}s
          <span className="ml-1 text-neutral-600">({duration.toFixed(1)}s)</span>
        </div>
      </div>
    </div>
  );
}

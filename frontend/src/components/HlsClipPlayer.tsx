import Hls from "hls.js";
import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";

type Props = {
  manifestUrl: string;
  thumbnailUrl?: string | null;
  title: string;
  startSec?: number;
  endSec?: number;
};

export function HlsClipPlayer({
  manifestUrl,
  thumbnailUrl,
  title,
  startSec,
  endSec,
}: Props) {
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Reset playing state whenever the clip identity changes — otherwise
  // selecting a new year keeps showing the previous video frame.
  useEffect(() => {
    setPlaying(false);
    setError(null);
  }, [manifestUrl, startSec, endSec]);

  // Attach hls.js / native HLS once the user opts in to playback.
  useEffect(() => {
    if (!playing) return;
    const video = videoRef.current;
    if (!video) return;
    let hls: Hls | null = null;

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Safari + iOS — native HLS via AVPlayer.
      video.src = manifestUrl;
    } else if (Hls.isSupported()) {
      hls = new Hls({ enableWorker: true });
      hls.loadSource(manifestUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (data.fatal) {
          setError(`HLS error: ${data.details}`);
        }
      });
    } else {
      setError("Your browser does not support HLS playback");
      return;
    }

    const onLoaded = () => {
      if (startSec != null) {
        try {
          video.currentTime = startSec;
        } catch {
          // Some browsers seek async; ignore here.
        }
      }
      video.play().catch(() => {
        // Autoplay can be blocked; user controls remain available.
      });
    };
    video.addEventListener("loadedmetadata", onLoaded);

    return () => {
      video.removeEventListener("loadedmetadata", onLoaded);
      if (hls) hls.destroy();
      video.pause();
      video.removeAttribute("src");
      video.load();
    };
  }, [playing, manifestUrl, startSec]);

  // Auto-stop at the clip's endSec so the user gets the curated moment,
  // not the full match.
  useEffect(() => {
    if (!playing || endSec == null) return;
    const video = videoRef.current;
    if (!video) return;
    const onTime = () => {
      if (video.currentTime >= endSec) video.pause();
    };
    video.addEventListener("timeupdate", onTime);
    return () => video.removeEventListener("timeupdate", onTime);
  }, [playing, endSec]);

  if (!playing) {
    return (
      <button
        onClick={() => setPlaying(true)}
        className="relative w-full aspect-video bg-surface-secondary rounded-video-thumbnail overflow-hidden border border-border-secondary group"
        title={`Play: ${title}`}
      >
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-foreground-subtle">
            No thumbnail
          </div>
        )}
        <div className="absolute inset-0 bg-black/35 group-hover:bg-black/15 transition-colors flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-white/95 flex items-center justify-center shadow-2xl group-hover:scale-105 transition-transform">
            <Icon name="play" className="w-5 h-5 text-foreground-body ml-0.5" />
          </div>
        </div>
      </button>
    );
  }

  return (
    <div className="relative w-full aspect-video bg-black rounded-video-thumbnail overflow-hidden border border-border-secondary">
      <video
        ref={videoRef}
        className="w-full h-full"
        controls
        playsInline
        poster={thumbnailUrl ?? undefined}
      />
      <button
        onClick={() => setPlaying(false)}
        className="absolute top-2 right-2 bg-black/70 hover:bg-black/90 text-white p-1 rounded-nav-item backdrop-blur-xs"
        title="Close player"
      >
        <Icon name="close" className="w-3.5 h-3.5" />
      </button>
      {error && (
        <div className="absolute inset-x-0 bottom-0 bg-[color-mix(in_srgb,var(--tl-color-system-color-red)_90%,transparent)] text-white text-xs p-2">
          {error}
        </div>
      )}
    </div>
  );
}

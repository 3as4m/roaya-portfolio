import { useEffect, useRef, useState } from 'react';

/** Where the MP4s live. Empty = served from this site; set VITE_MEDIA_BASE to a CDN/bucket URL to offload them. */
const MEDIA_BASE = ((import.meta.env.VITE_MEDIA_BASE as string | undefined) ?? '').replace(/\/$/, '');

interface BgVideoProps {
  src: string;
  poster: string;
  title: string;
  /** Container aspect, as a CSS aspect-ratio string. */
  aspect?: string;
  className?: string;
}

/**
 * Silent looping self-hosted clip, cover-fitted like a background video.
 * Replaces the old Vimeo iframe embeds — a plain <video> with object-fit:cover
 * gets the same visual result without booting a third-party player page per clip.
 *
 * The <video> itself doesn't mount until the card nears the viewport, so a page
 * with a dozen+ of these doesn't start a dozen simultaneous decodes on load.
 */
export function BgVideo({ src, poster, title, aspect = '16 / 9', className = '' }: BgVideoProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [inView, setInView] = useState(false);

  // Mount once the card nears the viewport, then play/pause as it enters and
  // leaves so off-screen clips stop decoding.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true);
        const v = videoRef.current;
        if (!v) return;
        if (entry.isIntersecting) void v.play().catch(() => {});
        else v.pause();
      },
      { rootMargin: '150px' },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [inView]);

  return (
    <div
      ref={rootRef}
      className={`relative overflow-hidden rounded-2xl bg-surface ${className}`}
      style={{ aspectRatio: aspect }}
    >
      {inView && (
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          poster={poster}
          title={title}
          muted
          loop
          playsInline
          autoPlay
          preload="metadata"
        >
          <source src={MEDIA_BASE ? `${MEDIA_BASE}${src.replace(/^\/media/, '')}` : src} type="video/mp4" />
        </video>
      )}
    </div>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import useMe from "../../hooks/useMe";
import { apiFetch, resolveMediaUrl } from "../../lib/api";

type Reel = {
  id: string;
  createdAt: string;
  caption?: string | null;
  mediaUrl?: string | null;
  thumbnailUrl?: string | null;
  locked?: boolean | null;
  author?: {
    id: string;
    name?: string | null;
    handle?: string | null;
    avatarUrl?: string | null;
  } | null;
  stats?: { likes?: number; comments?: number } | null;
};

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function IconHeart({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20.8 4.6c-1.6-1.7-4.2-1.7-5.8 0L12 7.7 9 4.6c-1.6-1.7-4.2-1.7-5.8 0-1.8 1.9-1.8 5 0 6.9l8.8 9.2 8.8-9.2c1.8-1.9 1.8-5 0-6.9z" />
    </svg>
  );
}

function IconChat({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
    </svg>
  );
}

function IconVolume({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 5 6 9H3v6h3l5 4V5z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      <path d="M18 6a9 9 0 0 1 0 12" />
    </svg>
  );
}

function IconMute({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 5 6 9H3v6h3l5 4V5z" />
      <path d="M16 9l5 5" />
      <path d="M21 9l-5 5" />
    </svg>
  );
}

function Avatar({ name, url, size = 40 }: { name?: string | null; url?: string | null; size?: number }) {
  const src = resolveMediaUrl(url || "");
  const initials = (name || "U").trim().slice(0, 1).toUpperCase();
  return (
    <div
      className="shrink-0 overflow-hidden rounded-full bg-white/10 flex items-center justify-center"
      style={{ width: size, height: size }}
      aria-label={name || "user"}
      title={name || "user"}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name || "user"} className="h-full w-full object-cover" />
      ) : (
        <span className="text-white/80 font-semibold">{initials}</span>
      )}
    </div>
  );
}

function formatCount(n?: number | null) {
  const x = n || 0;
  if (x >= 1_000_000) return `${(x / 1_000_000).toFixed(1).replace(".0", "")}M`;
  if (x >= 1_000) return `${(x / 1_000).toFixed(1).replace(".0", "")}K`;
  return String(x);
}

function ReelSlide({
  reel,
  active,
  authed,
  onAuthCta
}: {
  reel: Reel;
  active: boolean;
  authed: boolean;
  onAuthCta: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);

  const mediaSrc = resolveMediaUrl(reel.mediaUrl || "");
  const thumbSrc = resolveMediaUrl(reel.thumbnailUrl || "");

  const locked = Boolean(reel.locked) && !authed;

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    // Cuando el slide está activo, intentamos reproducir.
    // Si está locked, no reproducimos (solo muestra thumb + overlay).
    if (!active || locked) {
      try {
        v.pause();
      } catch {}
      setPlaying(false);
      return;
    }

    v.muted = muted;

    const play = async () => {
      try {
        await v.play();
        setPlaying(true);
      } catch {
        setPlaying(false);
      }
    };

    play();
  }, [active, muted, locked]);

  return (
    <div className="relative h-[100dvh] w-full snap-start overflow-hidden bg-black">
      {/* Media */}
      <div className="absolute inset-0">
        {locked ? (
          <div className="h-full w-full">
            {thumbSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={thumbSrc} alt="reel" className="h-full w-full object-cover blur-xl scale-110 opacity-80" />
            ) : (
              <div className="h-full w-full bg-gradient-to-b from-white/5 to-black" />
            )}
          </div>
        ) : (
          <>
            {mediaSrc ? (
              <video
                ref={videoRef}
                className="h-full w-full object-cover"
                src={mediaSrc}
                playsInline
                loop
                muted={muted}
                preload="metadata"
                poster={thumbSrc || undefined}
                onClick={() => {
                  const v = videoRef.current;
                  if (!v) return;
                  if (v.paused) v.play().catch(() => {});
                  else v.pause();
                }}
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-b from-white/5 to-black" />
            )}
          </>
        )}
      </div>

      {/* Overlay UI */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Gradient para legibilidad */}
        <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Author + caption */}
        <div className="absolute bottom-6 left-4 right-20 flex flex-col gap-3 pointer-events-auto">
          <div className="flex items-center gap-3">
            <Avatar name={reel.author?.name || reel.author?.handle} url={reel.author?.avatarUrl} size={44} />
            <div className="min-w-0">
              <div className="text-white font-semibold leading-tight truncate">
                {reel.author?.handle ? `@${reel.author.handle}` : reel.author?.name || "Creador"}
              </div>
              <div className="text-white/60 text-xs">{new Date(reel.createdAt).toLocaleString()}</div>
            </div>
          </div>

          {reel.caption ? <div className="text-white/90 text-sm line-clamp-3">{reel.caption}</div> : null}

          {locked ? (
            <button
              onClick={onAuthCta}
              className="pointer-events-auto inline-flex items-center justify-center rounded-xl bg-white text-black font-semibold px-4 py-2 w-fit"
            >
              Inicia sesión para ver este reel
            </button>
          ) : null}
        </div>

        {/* Right actions */}
        <div className="absolute bottom-10 right-3 flex flex-col items-center gap-5 pointer-events-auto">
          <button
            className="rounded-full bg-white/10 p-3 backdrop-blur border border-white/10"
            onClick={() => setMuted((m) => !m)}
            aria-label={muted ? "Unmute" : "Mute"}
            title={muted ? "Activar sonido" : "Silenciar"}
          >
            {muted ? <IconMute className="h-6 w-6 text-white" /> : <IconVolume className="h-6 w-6 text-white" />}
          </button>

          <div className="flex flex-col items-center gap-1">
            <button className="rounded-full bg-white/10 p-3 backdrop-blur border border-white/10" aria-label="Like">
              <IconHeart className="h-6 w-6 text-white" />
            </button>
            <div className="text-white/80 text-xs">{formatCount(reel.stats?.likes)}</div>
          </div>

          <div className="flex flex-col items-center gap-1">
            <button className="rounded-full bg-white/10 p-3 backdrop-blur border border-white/10" aria-label="Comments">
              <IconChat className="h-6 w-6 text-white" />
            </button>
            <div className="text-white/80 text-xs">{formatCount(reel.stats?.comments)}</div>
          </div>

          <div className="text-white/50 text-[10px] mt-2">{playing ? "▶" : "Ⅱ"}</div>
        </div>
      </div>
    </div>
  );
}

export default function ReelsClient() {
  const router = useRouter();
  const { me, loading: meLoading } = useMe();
  const authed = Boolean(me?.user?.id);

  const [items, setItems] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const canShow = useMemo(() => !meLoading, [meLoading]);

  const onAuthCta = () => {
    router.push("/login?next=/reels");
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setErr(null);

        // Tu API (apps/api/src/index.ts) monta feedRouter en "/"
        // y feedRouter expone GET "/videos" para reels.
        const data = await apiFetch<{ items: Reel[] }>("/videos");
        if (!mounted) return;
        setItems(Array.isArray(data.items) ? data.items : []);
      } catch (e: any) {
        if (!mounted) return;
        setErr(e?.message || "Error cargando reels");
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onScroll = () => {
      const h = window.innerHeight || 1;
      const idx = Math.round(el.scrollTop / h);
      setActiveIndex(Math.max(0, Math.min(idx, items.length - 1)));
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [items.length]);

  if (!canShow) {
    return <div className="min-h-[100dvh] bg-black" />;
  }

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-black flex items-center justify-center text-white/70">
        Cargando reels…
      </div>
    );
  }

  if (err) {
    return (
      <div className="min-h-[100dvh] bg-black flex flex-col items-center justify-center gap-3 text-white/80 px-6">
        <div className="text-center">Error: {err}</div>
        <button
          className="rounded-xl bg-white text-black font-semibold px-4 py-2"
          onClick={() => window.location.reload()}
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="min-h-[100dvh] bg-black flex flex-col items-center justify-center gap-3 text-white/80 px-6">
        <div>No hay reels todavía.</div>
        <div className="text-white/50 text-sm text-center">
          Sube un video desde el panel/creación de posts para que aparezca aquí.
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-[100dvh] w-full overflow-y-auto snap-y snap-mandatory bg-black"
      style={{ scrollSnapType: "y mandatory" }}
    >
      {items.map((reel, idx) => (
        <ReelSlide key={reel.id} reel={reel} active={idx === activeIndex} authed={authed} onAuthCta={onAuthCta} />
      ))}
    </div>
  );
}

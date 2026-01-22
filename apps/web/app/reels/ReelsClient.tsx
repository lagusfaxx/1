"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { apiFetch, resolveMediaUrl } from "../../lib/api";
import CreatePostModal from "../../components/CreatePostModal";
import Avatar from "../../components/Avatar";

type ReelPost = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  paywalled: boolean;
  preview: { id: string; type: "VIDEO"; url: string } | null;
  media: { id: string; type: "VIDEO"; url: string }[];
  author: {
    id: string;
    displayName: string | null;
    username: string;
    avatarUrl: string | null;
    profileType: string;
  };
};

type FeedResponse = { posts: ReelPost[]; nextPage: number | null };

function ReelSlide({
  post,
  muted,
  onToggleMute
}: {
  post: ReelPost;
  muted: boolean;
  onToggleMute: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [broken, setBroken] = useState(false);
  const src = useMemo(() => {
    const direct = post.media?.[0]?.url || post.preview?.url || null;
    return resolveMediaUrl(direct);
  }, [post.media, post.preview]);

  useEffect(() => {
    const el = containerRef.current;
    const vid = videoRef.current;
    if (!el || !vid) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const isVisible = entries[0]?.isIntersecting;
        if (!isVisible) {
          vid.pause();
          return;
        }
        // Autoplay when visible
        const p = vid.play();
        if (p && typeof (p as any).catch === "function") {
          (p as any).catch(() => null);
        }
      },
      { threshold: 0.65 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full snap-start overflow-hidden rounded-3xl border border-white/10 bg-black"
      style={{ height: "calc(100dvh - 160px)", paddingBottom: "calc(env(safe-area-inset-bottom) + 76px)" }}
    >
      {src && !broken ? (
        <video
          ref={videoRef}
          src={src}
          className={`h-full w-full object-cover ${post.paywalled ? "blur-lg scale-105" : ""}`}
          autoPlay
          muted={muted}
          playsInline
          loop
          preload="metadata"
          controls={false}
          onError={() => setBroken(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-white/10 to-transparent">
          <div className="text-center">
            <div className="text-sm font-semibold text-white">Contenido no disponible</div>
            <div className="mt-1 text-xs text-white/60">Puede ser un problema temporal con el video.</div>
            <button
              type="button"
              className="pointer-events-auto mt-4 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white/90 hover:bg-white/10"
              onClick={() => {
                setBroken(false);
                // force reload
                const v = videoRef.current;
                if (v) {
                  v.load();
                  const p = v.play();
                  if (p && typeof (p as any).catch === "function") (p as any).catch(() => null);
                }
              }}
            >
              Reintentar
            </button>
          </div>
        </div>
      )}

      {/* overlay */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

      <div className="absolute left-5 bottom-5 right-20">
        <Link href={`/perfil/${post.author.username}`} className="inline-flex items-center gap-3 hover:opacity-95">
          <Avatar url={post.author.avatarUrl} alt={post.author.username} size={40} ringClassName="border-white/20" />
          <div>
            <div className="text-sm font-semibold text-white">{post.author.displayName || post.author.username}</div>
            <div className="text-xs text-white/70">@{post.author.username}</div>
          </div>
        </Link>
        {post.body ? <div className="mt-2 text-sm text-white/85 line-clamp-2">{post.body}</div> : null}
      </div>

      <div className="absolute right-4 bottom-5 flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={onToggleMute}
          className="pointer-events-auto rounded-full border border-white/20 bg-black/40 px-3 py-2 text-xs text-white/90"
        >
          {muted ? "🔇" : "🔊"}
        </button>
        <button type="button" className="pointer-events-auto rounded-full border border-white/20 bg-black/40 px-3 py-2 text-xs text-white/90">
          ❤
        </button>
        <Link href={`/chats/${post.author.id}`} className="pointer-events-auto rounded-full border border-white/20 bg-black/40 px-3 py-2 text-xs text-white/90">
          ✉
        </Link>
        {post.paywalled ? (
          <Link
            href={`/perfil/${post.author.username}`}
            className="pointer-events-auto rounded-full bg-white px-4 py-2 text-xs font-semibold text-black"
          >
            Suscribirse
          </Link>
        ) : null}
      </div>

      {post.paywalled ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="pointer-events-none rounded-2xl border border-white/15 bg-black/45 px-5 py-4 text-center">
            <div className="text-sm font-semibold">Contenido exclusivo</div>
            <div className="mt-1 text-xs text-white/70">Suscríbete para desbloquear este reel</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function ReelsClient() {
  const router = useRouter();
  const { me, loading: meLoading } = useMe();
  const authed = Boolean(me?.user?.id);

  const [posts, setPosts] = useState<ReelPost[]>([]);
  const [nextPage, setNextPage] = useState<number | null>(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [muted, setMuted] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  async function load(page: number, mode: "reset" | "append") {
    if (mode === "reset") setLoading(true);
    try {
      const res = await apiFetch<FeedResponse>(`/posts?type=VIDEO&tab=for-you&page=${page}&limit=8`);
      setPosts((prev) => (mode === "append" ? [...prev, ...res.posts] : res.posts));
      setNextPage(res.nextPage);
      setError(null);
    } catch (e: any) {
      setError(e?.message || "No se pudieron cargar los reels");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(1, "reset");
  }, []);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    if (!nextPage || loading) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && nextPage) {
        load(nextPage, "append");
      }
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, [nextPage, loading]);

  if (loading && !posts.length) {
    return (
      <div className="card p-6">
        <div className="h-5 w-32 rounded bg-white/10 animate-pulse" />
        <div className="mt-3 h-4 w-60 rounded bg-white/10 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Reels</h1>
        <button className="btn-secondary" onClick={() => {
          if (!authed) {
            router.push(`/login?next=${encodeURIComponent("/reels")}`);
            return;
          }
          setModalOpen(true);
        }}>
          Crear reel
        </button>
      </div>

      {error ? (
        <div className="card p-4 text-sm text-red-200 border-red-500/30 bg-red-500/10">
          {error}
          <button className="btn-ghost ml-3" onClick={() => load(1, "reset")}>
            Reintentar
          </button>
        </div>
      ) : null}

      <div className="mx-auto w-full max-w-[520px]">
        <div className="overflow-y-auto snap-y snap-mandatory grid gap-4"
          style={{ height: "calc(100dvh - 140px)", paddingBottom: "calc(env(safe-area-inset-bottom) + 76px)" }}>
          {posts.map((post) => (
            <ReelSlide key={post.id} post={post} muted={muted} onToggleMute={() => setMuted((m) => !m)} />
          ))}
          <div ref={sentinelRef} className="h-10" />
        </div>
      </div>

      <CreatePostModal isOpen={modalOpen} onClose={() => setModalOpen(false)} defaultMode="VIDEO" onCreated={() => load(1, "reset")} />
    </div>
  );
}

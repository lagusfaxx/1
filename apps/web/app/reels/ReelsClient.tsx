"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch, resolveMediaUrl } from "../../lib/api";
import useMe from "../../hooks/useMe";
import { Avatar } from "../../components/Avatar";
import { MediaPreview } from "../../components/MediaPreview";

type Reel = {
  id: string;
  createdAt?: string;
  caption?: string | null;
  media: { id: string; kind: "IMAGE" | "VIDEO"; url: string; width?: number | null; height?: number | null }[];
  author: { id: string; username: string; displayName?: string | null; avatarUrl?: string | null };
  likesCount?: number;
  commentsCount?: number;
  viewerHasLiked?: boolean;
};

export default function ReelsClient() {
  const router = useRouter();
  const { me, loading: meLoading } = useMe();
  const authed = Boolean(me?.user?.id);

  const [items, setItems] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const active = useMemo(() => items[activeIndex] ?? null, [items, activeIndex]);

  async function loadMore(initial = false) {
    try {
      setErr(null);
      if (initial) setLoading(true);

      const qs = new URLSearchParams();
      if (!initial && cursor) qs.set("cursor", cursor);

      const res = await apiFetch(`/reels?${qs.toString()}`, { method: "GET" });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `HTTP ${res.status}`);
      }

      const data = await res.json();

      const nextItems: Reel[] = data?.items ?? data?.reels ?? [];
      const nextCursor: string | null = data?.nextCursor ?? null;
      const nextHasMore: boolean = Boolean(data?.hasMore ?? nextCursor);

      setItems((prev) => (initial ? nextItems : [...prev, ...nextItems]));
      setCursor(nextCursor);
      setHasMore(nextHasMore && nextItems.length > 0);
    } catch (e: any) {
      setErr(e?.message ?? "Error cargando reels");
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMore(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Snap scroll (intersección simple)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onScroll = () => {
      const children = Array.from(el.querySelectorAll<HTMLElement>("[data-reel]"));
      if (!children.length) return;

      const top = el.scrollTop;
      let bestIdx = 0;
      let bestDist = Infinity;

      children.forEach((node, idx) => {
        const dist = Math.abs(node.offsetTop - top);
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = idx;
        }
      });

      setActiveIndex(bestIdx);

      // prefetch cuando esté cerca del final
      if (hasMore && !loading && bestIdx >= children.length - 2) {
        loadMore(false);
      }
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [hasMore, loading, cursor]);

  const requireAuth = () => {
    if (!authed && !meLoading) {
      router.push("/login?next=/reels");
      return true;
    }
    return false;
  };

  const onLike = async (reelId: string) => {
    if (requireAuth()) return;

    // optimista
    setItems((prev) =>
      prev.map((r) =>
        r.id === reelId
          ? {
              ...r,
              viewerHasLiked: !r.viewerHasLiked,
              likesCount: Math.max(0, (r.likesCount ?? 0) + (r.viewerHasLiked ? -1 : 1)),
            }
          : r
      )
    );

    try {
      const res = await apiFetch(`/reels/${reelId}/like`, { method: "POST" });
      if (!res.ok) {
        // revert si falla
        setItems((prev) =>
          prev.map((r) =>
            r.id === reelId
              ? {
                  ...r,
                  viewerHasLiked: !r.viewerHasLiked,
                  likesCount: Math.max(0, (r.likesCount ?? 0) + (r.viewerHasLiked ? -1 : 1)),
                }
              : r
          )
        );
      }
    } catch {
      // revert si falla
      setItems((prev) =>
        prev.map((r) =>
          r.id === reelId
            ? {
                ...r,
                viewerHasLiked: !r.viewerHasLiked,
                likesCount: Math.max(0, (r.likesCount ?? 0) + (r.viewerHasLiked ? -1 : 1)),
              }
            : r
        )
      );
    }
  };

  if (loading && items.length === 0) {
    return (
      <div className="p-6 text-sm text-neutral-500">
        Cargando reels…
      </div>
    );
  }

  if (err && items.length === 0) {
    return (
      <div className="p-6">
        <div className="text-sm text-red-500 mb-3">Error: {err}</div>
        <button
          className="px-3 py-2 rounded-md bg-neutral-900 text-white text-sm"
          onClick={() => loadMore(true)}
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] bg-black text-white">
      <div
        ref={containerRef}
        className="h-full overflow-y-auto snap-y snap-mandatory"
      >
        {items.map((r) => {
          const media0 = r.media?.[0];
          const mediaUrl = media0?.url ? resolveMediaUrl(media0.url) : null;

          return (
            <div
              key={r.id}
              data-reel
              className="relative h-[calc(100vh-64px)] snap-start flex items-center justify-center"
            >
              <div className="absolute inset-0 flex items-center justify-center">
                {mediaUrl ? (
                  <MediaPreview
                    kind={media0.kind}
                    url={mediaUrl}
                    className="h-full w-full object-contain"
                    autoPlay
                    muted
                    loop
                    playsInline
                  />
                ) : (
                  <div className="text-neutral-400 text-sm">Sin media</div>
                )}
              </div>

              {/* overlay */}
              <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/70 via-black/20 to-transparent">
                <div className="flex items-center gap-3">
                  <Avatar url={r.author.avatarUrl ?? undefined} size={36} />
                  <div className="min-w-0">
                    <Link
                      href={`/u/${encodeURIComponent(r.author.username)}`}
                      className="text-sm font-semibold hover:underline"
                    >
                      {r.author.displayName || `@${r.author.username}`}
                    </Link>
                    {r.caption ? (
                      <div className="text-sm text-white/90 line-clamp-2 mt-1">
                        {r.caption}
                      </div>
                    ) : null}
                  </div>

                  <div className="ml-auto flex items-center gap-2">
                    <button
                      className="px-3 py-2 rounded-full bg-white/10 hover:bg-white/15 text-sm"
                      onClick={() => onLike(r.id)}
                      title="Like"
                    >
                      {r.viewerHasLiked ? "♥" : "♡"} {r.likesCount ?? 0}
                    </button>

                    <Link
                      className="px-3 py-2 rounded-full bg-white/10 hover:bg-white/15 text-sm"
                      href={`/reels/${r.id}`}
                      title="Abrir"
                    >
                      Abrir
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {loading ? (
          <div className="p-6 text-center text-sm text-white/70">Cargando más…</div>
        ) : null}

        {!hasMore && items.length > 0 ? (
          <div className="p-6 text-center text-sm text-white/50">No hay más reels</div>
        ) : null}
      </div>
    </div>
  );
}

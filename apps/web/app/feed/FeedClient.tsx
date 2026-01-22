"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { apiGet, resolveMediaUrl } from "@/lib/api";

type FeedPost = {
  id: string;
  title?: string | null;
  text?: string | null;
  isPublic?: boolean | null;
  createdAt?: string;
  mediaUrl?: string | null;
  mediaType?: "IMAGE" | "VIDEO" | string | null;
  author: {
    id: string;
    username: string;
    displayName?: string | null;
    avatarUrl?: string | null;
  };
};

function formatDate(dateString?: string) {
  if (!dateString) return "";
  try {
    const d = new Date(dateString);
    return d.toLocaleString("es-CL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function Media({ post }: { post: FeedPost }) {
  if (!post.mediaUrl) return null;

  const src = resolveMediaUrl(post.mediaUrl);

  if (post.mediaType === "VIDEO" || src.endsWith(".mp4")) {
    return (
      <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-black">
        <video
          src={src}
          className="block h-auto w-full"
          preload="metadata"
          playsInline
          muted
          controls
        />
      </div>
    );
  }

  // default image
  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-black">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={post.title || "Post"} className="block h-auto w-full object-cover" />
    </div>
  );
}

export default function FeedClient() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hasPosts = posts.length > 0;

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        // endpoint existente (ya estaba en el proyecto)
        const data = await apiGet<{ items?: FeedPost[]; posts?: FeedPost[]; data?: FeedPost[] }>(
          "/posts/feed"
        );

        const items = (data.items || data.posts || data.data || []) as FeedPost[];

        if (mounted) {
          setPosts(items);
        }
      } catch (e: any) {
        if (mounted) {
          setError(e?.message || "No se pudo cargar el feed.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const content = useMemo(() => {
    if (loading) {
      return (
        <div className="card p-6">
          <div className="text-white/70">Cargando publicaciones…</div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="card p-6">
          <div className="text-white/80 font-medium">No se pudo cargar el feed</div>
          <div className="mt-2 text-sm text-white/50">{error}</div>
        </div>
      );
    }

    if (!hasPosts) {
      return (
        <div className="card p-6">
          <div className="text-white/80 font-medium">Aún no hay publicaciones</div>
          <div className="mt-2 text-sm text-white/50">Sé el primero en publicar algo ✨</div>
        </div>
      );
    }

    return (
      <div className="grid gap-6">
        {posts.map((post) => {
          const profileHref = `/perfil/${post.author.username}`;

          return (
            <article key={post.id} className="card p-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Link href={profileHref} className="block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={resolveMediaUrl(post.author.avatarUrl || "/avatar-placeholder.png")}
                      alt={post.author.username}
                      className="h-10 w-10 rounded-full object-cover border border-white/10"
                    />
                  </Link>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Link
                        href={profileHref}
                        className="truncate font-semibold text-white hover:text-white/90"
                        aria-label="Abrir perfil"
                      >
                        {post.author.displayName || post.author.username}
                      </Link>

                      <Link
                        href={profileHref}
                        className="text-xs text-white/40 hover:text-white/60"
                        aria-label="Abrir perfil"
                      >
                        @{post.author.username}
                      </Link>
                    </div>

                    <div className="text-xs text-white/35">{formatDate(post.createdAt)}</div>
                  </div>
                </div>

                {post.isPublic ? (
                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/50">
                    Público
                  </span>
                ) : (
                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/50">
                    Solo suscriptores
                  </span>
                )}
              </div>

              {post.title ? (
                <div className="mt-4 text-base font-semibold text-white">{post.title}</div>
              ) : null}

              {post.text ? <div className="mt-2 whitespace-pre-line text-white/70">{post.text}</div> : null}

              <Media post={post} />
            </article>
          );
        })}
      </div>
    );
  }, [loading, error, hasPosts, posts]);

  return (
    <div className="grid gap-6">
      <div className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-lg font-semibold text-white">Inicio</div>
            <div className="text-sm text-white/50">Publicaciones de creadores y profesionales.</div>
          </div>

          <div className="flex rounded-full border border-white/10 bg-white/5 p-1">
            <button className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white">
              Para ti
            </button>
            <button className="rounded-full px-4 py-2 text-sm font-medium text-white/60 hover:text-white">
              Siguiendo
            </button>
          </div>
        </div>
      </div>

      {content}
    </div>
  );
}

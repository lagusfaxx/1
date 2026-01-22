"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { apiFetch } from "../../lib/api";
import useMe from "../../hooks/useMe";
import { useRouter } from "next/navigation";
import { MediaPreview } from "../../components/Media";
import CreatePostModal from "../../components/CreatePostModal";
import FloatingCreateButton from "../../components/FloatingCreateButton";
import Avatar from "../../components/Avatar";

type FeedPost = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  isPublic: boolean;
  paywalled: boolean;
  isSubscribed: boolean;
  preview: { id: string; type: "IMAGE" | "VIDEO"; url: string } | null;
  media: { id: string; type: "IMAGE" | "VIDEO"; url: string }[];
  author: {
    id: string;
    displayName: string | null;
    username: string;
    avatarUrl: string | null;
    profileType: string;
  };
};

type FeedResponse = { posts: FeedPost[]; nextPage: number | null };

export default function FeedClient() {
  const router = useRouter();
  const { me } = useMe();
  const authed = Boolean(me?.user?.id);

  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextPage, setNextPage] = useState<number | null>(1);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [tab, setTab] = useState<"Para ti" | "Siguiendo">("Para ti");
  const [modalOpen, setModalOpen] = useState(false);

  async function load(page: number, mode: "reset" | "append") {
    if (mode === "append") setLoadingMore(true);
    if (mode === "reset") setLoading(true);
    try {
      const apiTab = tab === "Siguiendo" ? "following" : "for-you";
      const res = await apiFetch<FeedResponse>(
        `/posts?type=IMAGE&tab=${encodeURIComponent(apiTab)}&page=${page}&limit=12`
      );
      setPosts((prev) => (mode === "append" ? [...prev, ...res.posts] : res.posts));
      setNextPage(res.nextPage);
      setError(null);
    } catch (e: any) {
      setError(e?.message || "No se pudo cargar el inicio");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    setNextPage(1);
    load(1, "reset");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    if (!nextPage || loading || loadingMore) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && nextPage) {
        load(nextPage, "append");
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [nextPage, loading, loadingMore]);

  const openCreate = () => {
    if (!authed) {
      router.push(`/login?next=${encodeURIComponent("/inicio")}`);
      return;
    }
    setModalOpen(true);
  };

  if (loading) {
    return (
      <div className="grid gap-6">
        <div className="card p-6">
          <div className="h-6 w-40 rounded bg-white/10 animate-pulse" />
          <div className="mt-3 h-4 w-72 rounded bg-white/10 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Inicio</h1>
            <p className="mt-1 text-sm text-white/70">Publicaciones de creadores y profesionales.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2 py-1">
              {(["Para ti", "Siguiendo"] as const).map((item) => (
                <button
                  key={item}
                  className={tab === item ? "btn-primary" : "btn-secondary"}
                  onClick={() => setTab(item)}
                  type="button"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {error ? (
        <div className="card p-4 text-sm text-red-200 border-red-500/30 bg-red-500/10">{error}</div>
      ) : null}

      <div className="grid gap-6 max-w-[630px] mx-auto w-full">
        {posts.map((post) => {
          const preview = post.preview ? { url: post.preview.url, type: post.preview.type } : null;
          const profileHref = `/perfil/${post.author.username}`;
          const typeLabel =
            post.author.profileType === "CREATOR"
              ? "Creadora"
              : post.author.profileType === "PROFESSIONAL"
                ? "Profesional"
                : post.author.profileType === "SHOP"
                  ? "Negocio"
                  : "Persona";

          return (
            <article key={post.id} className="card p-6">
              <div className="flex items-center justify-between gap-3">
                <Link href={profileHref} className="flex items-center gap-3 hover:opacity-95">
                  <Avatar url={post.author.avatarUrl} alt={post.author.username} size={48} />
                  <div>
                    <div className="font-semibold">{post.author.displayName || post.author.username}</div>
                    <div className="text-xs text-white/50">
                      {typeLabel} • {new Date(post.createdAt).toLocaleString("es-CL")}
                    </div>
                  </div>
                </Link>

                {/* ✅ FIX: cierre correcto del Link */}
                <Link
                  href={profileHref}
                  className="text-xs text-white/40 hover:text-white/60"
                  aria-label="Abrir perfil"
                >
                  @{post.author.username}
                </Link>
              </div>

              <div className="mt-4 text-sm text-white/80">{post.body}</div>

              <div className="mt-4">
                <MediaPreview
                  item={preview}
                  paywalled={post.paywalled}
                  alt={post.title}
                  className="h-[360px] w-full"
                />
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                <button className="btn-ghost" type="button">
                  ❤️ Me gusta
                </button>
                <button className="btn-ghost" type="button">
                  💾 Guardar
                </button>
                <button className="btn-ghost" type="button">
                  💬 Comentar
                </button>
                <button
                  className="btn-ghost"
                  type="button"
                  onClick={() => {
                    if (!authed) {
                      router.push(`/login?next=${encodeURIComponent(`/chats/${post.author.id}`)}`);
                      return;
                    }
                    router.push(`/chats/${post.author.id}`);
                  }}
                >
                  ✉️ Enviar
                </button>
              </div>
            </article>
          );
        })}

        {!posts.length ? (
          <div className="card p-8 text-center text-white/70">
            <p className="text-lg font-semibold">Sigue perfiles o publica algo</p>
            <p className="mt-2 text-sm text-white/50">Crea tu primer post o descubre nuevos perfiles.</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <button className="btn-primary" onClick={openCreate} type="button">
                Crear publicación
              </button>
              <Link className="btn-secondary" href="/explore">
                Explorar perfiles
              </Link>
            </div>
          </div>
        ) : null}
      </div>

      <div ref={sentinelRef} className="h-10" />

      <FloatingCreateButton onClick={openCreate} />
      <CreatePostModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onCreated={() => load(1, "reset")} />
    </div>
  );
}

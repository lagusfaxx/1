"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import useMe from "../hooks/useMe";
import { apiFetch } from "../lib/api";
import Avatar from "./Avatar";
import CreatePostModal from "./CreatePostModal";

type Notification = {
  id?: string | number;
  readAt?: string | null;
  createdAt?: string | null;
  type?: string;
  title?: string | null;
  body?: string | null;
  href?: string | null;
};

type IconName =
  | "home"
  | "reels"
  | "search"
  | "notifs"
  | "messages"
  | "create"
  | "profile"
  | "settings"
  | "logout"
  | "menu";

type NavItem = {
  label: string;
  href: string;
  icon: IconName;
  badge?: number;
  onClick?: () => void;
};

function Icon({ name }: { name: IconName }) {
  // Simple IG-like icon set (inline SVG so we don't add deps)
  switch (name) {
    case "home":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6">
          <path
            fill="currentColor"
            d="M12 3.172 3 10.5V21a1 1 0 0 0 1 1h6v-7h4v7h6a1 1 0 0 0 1-1V10.5l-9-7.328ZM19 20h-4v-7a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v7H5v-8.5l7-5.7 7 5.7V20Z"
          />
        </svg>
      );
    case "reels":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6">
          <path
            fill="currentColor"
            d="M4 5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1h1a2 2 0 0 1 2 2v11a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V5Zm2 0v14a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8h-3v1a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V5Zm9 1V5H6v3h9V6Zm-3 7.2a.8.8 0 0 1 1.2.7v3.2a.8.8 0 0 1-1.2.7l-2.8-1.6a.8.8 0 0 1 0-1.4l2.8-1.6Z"
          />
        </svg>
      );
    case "search":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6">
          <path
            fill="currentColor"
            d="M10 4a6 6 0 1 1 0 12 6 6 0 0 1 0-12Zm0 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm8.707 13.293-3.2-3.2 1.414-1.414 3.2 3.2a1 1 0 0 1-1.414 1.414Z"
          />
        </svg>
      );
    case "notifs":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6">
          <path
            fill="currentColor"
            d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Zm7-6V11a7 7 0 0 0-5-6.71V3a2 2 0 1 0-4 0v1.29A7 7 0 0 0 5 11v5l-2 2v1h20v-1l-2-2Zm-2 1H7v-6a5 5 0 1 1 10 0v6Z"
          />
        </svg>
      );
    case "messages":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6">
          <path
            fill="currentColor"
            d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-5 3v-3H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm16 2H4v10h2a1 1 0 0 1 1 1v1.2L8.8 16H20V6Z"
          />
        </svg>
      );
    case "create":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6">
          <path
            fill="currentColor"
            d="M12 5a1 1 0 0 1 1 1v5h5a1 1 0 1 1 0 2h-5v5a1 1 0 1 1-2 0v-5H6a1 1 0 1 1 0-2h5V6a1 1 0 0 1 1-1Z"
          />
        </svg>
      );
    case "profile":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6">
          <path
            fill="currentColor"
            d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4.418 0-8 2.015-8 4.5V20h16v-1.5c0-2.485-3.582-4.5-8-4.5Z"
          />
        </svg>
      );
    case "settings":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6">
          <path
            fill="currentColor"
            d="M19.14 12.94a7.99 7.99 0 0 0 .06-.94 7.99 7.99 0 0 0-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.52 7.52 0 0 0-1.63-.94l-.36-2.54A.5.5 0 0 0 12.9 1h-3.8a.5.5 0 0 0-.49.42l-.36 2.54a7.52 7.52 0 0 0-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L1.71 7.48a.5.5 0 0 0 .12.64l2.03 1.58a7.99 7.99 0 0 0-.06.94c0 .32.02.63.06.94L1.83 14.52a.5.5 0 0 0-.12.64l1.92 3.32a.5.5 0 0 0 .6.22l2.39-.96c.5.39 1.05.72 1.63.94l.36 2.54a.5.5 0 0 0 .49.42h3.8a.5.5 0 0 0 .49-.42l.36-2.54c.58-.22 1.13-.55 1.63-.94l2.39.96a.5.5 0 0 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58ZM11 15a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z"
          />
        </svg>
      );
    case "logout":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6">
          <path
            fill="currentColor"
            d="M10 17v2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h6v2H4v10h6Zm9.707-5.707-3-3-1.414 1.414L16.586 11H10v2h6.586l-1.293 1.293 1.414 1.414 3-3a1 1 0 0 0 0-1.414ZM14 5h6a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-6v-2h6V7h-6V5Z"
          />
        </svg>
      );
    case "menu":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6">
          <path fill="currentColor" d="M4 6h16v2H4V6Zm0 5h16v2H4v-2Zm0 5h16v2H4v-2Z" />
        </svg>
      );
    default:
      return null;
  }
}

function Badge({ value }: { value?: number }) {
  if (!value || value <= 0) return null;
  const text = value > 99 ? "99+" : String(value);
  return (
    <span className="absolute -right-1 -top-1 min-w-[18px] rounded-full bg-red-500 px-1 text-center text-[11px] font-semibold leading-[18px] text-white shadow">
      {text}
    </span>
  );
}

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const { me, loading } = useMe();

  const authed = !!me?.user?.id;
  const username = me?.user?.username || "";

  const [collapsed, setCollapsed] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const [unreadNotifs, setUnreadNotifs] = useState<number>(0);
  const [unreadMessages, setUnreadMessages] = useState<number>(0);

  const nextHref = useMemo(() => {
    // keep next stable even on dynamic routes
    const p = pathname || "/";
    return encodeURIComponent(p);
  }, [pathname]);

  const requireAuth = (target: string, onAuthed?: () => void) => {
    if (!authed) {
      router.push(`/login?next=${encodeURIComponent(target)}`);
      return;
    }
    onAuthed?.();
  };

  // Only fetch inbox/notifs when authed (avoid spamming 401 in console)
  useEffect(() => {
    let alive = true;

    async function loadBadges() {
      if (!authed) {
        if (alive) {
          setUnreadNotifs(0);
          setUnreadMessages(0);
        }
        return;
      }

      try {
        const notifs = await apiFetch<Notification[]>("/notifications");
        const unread = Array.isArray(notifs) ? notifs.filter((n) => !n.readAt).length : 0;
        if (alive) setUnreadNotifs(unread);
      } catch {
        if (alive) setUnreadNotifs(0);
      }

      try {
        const inbox = await apiFetch<{ conversations: Array<{ unreadCount?: number }> }>("/messages/inbox");
        const totalUnread = (inbox?.conversations || []).reduce((acc, c) => acc + (c.unreadCount || 0), 0);
        if (alive) setUnreadMessages(totalUnread);
      } catch {
        if (alive) setUnreadMessages(0);
      }
    }

    void loadBadges();
    return () => {
      alive = false;
    };
  }, [authed]);

  const profileHref = authed && username ? `/perfil/${username}` : `/login?next=${nextHref}`;

  const primary: NavItem[] = [
    { label: "Inicio", href: "/inicio", icon: "home" },
    { label: "Reels", href: "/reels", icon: "reels" },
    {
      label: "Buscar",
      href: "#",
      icon: "search",
      onClick: () => setSearchOpen(true),
    },
  ];

  const secondary: NavItem[] = [
    {
      label: "Crear",
      href: "#",
      icon: "create",
      onClick: () => requireAuth(pathname || "/inicio", () => setCreateOpen(true)),
    },
    {
      label: "Mensajes",
      href: authed ? "/mensajes" : `/login?next=${encodeURIComponent("/mensajes")}`,
      icon: "messages",
      badge: unreadMessages,
      onClick: () => requireAuth("/mensajes", () => router.push("/mensajes")),
    },
    {
      label: "Notificaciones",
      href: authed ? "/notificaciones" : `/login?next=${encodeURIComponent("/notificaciones")}`,
      icon: "notifs",
      badge: unreadNotifs,
      onClick: () => requireAuth("/notificaciones", () => router.push("/notificaciones")),
    },
    {
      label: "Perfil",
      href: profileHref,
      icon: "profile",
      onClick: () => requireAuth(`/perfil/${username || ""}`, () => router.push(`/perfil/${username}`)),
    },
  ];

  const accountItems: NavItem[] = authed
    ? [
        { label: "Mi cuenta", href: profileHref, icon: "profile" },
        { label: "Configuración", href: "/configuracion", icon: "settings" },
        { label: "Cerrar sesión", href: "/logout", icon: "logout" },
      ]
    : [{ label: "Iniciar sesión", href: `/login?next=${nextHref}`, icon: "profile" }];

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex h-screen sticky top-0 ${collapsed ? "w-[88px]" : "w-[280px]"} shrink-0 flex-col border-r border-white/10 bg-black/40 backdrop-blur supports-[backdrop-filter]:bg-black/30`}
      >
        <div className="flex items-center justify-between px-4 py-4">
          <Link href="/inicio" className="flex items-center gap-2" aria-label="UZEED">
            <img
              src={collapsed ? "/brand/mark.svg" : "/brand/logo.svg"}
              alt="UZEED"
              className={collapsed ? "h-8 w-8" : "h-8 w-auto"}
              onError={(e) => {
                // never break layout if missing asset
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          </Link>

          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/80 transition hover:bg-white/10"
            aria-label={collapsed ? "Expandir" : "Colapsar"}
          >
            <Icon name="menu" />
          </button>
        </div>

        <nav className="flex flex-col gap-1 px-3">
          {[...primary, ...secondary].map((item) => {
            const isActive = item.href !== "#" && pathname?.startsWith(item.href);
            const content = (
              <span
                className={`relative flex items-center gap-3 rounded-2xl px-3 py-3 text-[15px] font-medium transition ${
                  isActive ? "bg-white/10 text-white" : "text-white/80 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span className="relative">
                  <Icon name={item.icon} />
                  <Badge value={item.badge} />
                </span>
                {!collapsed && <span className="truncate">{item.label}</span>}
              </span>
            );

            if (item.onClick || item.href === "#") {
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => item.onClick?.()}
                  className="text-left"
                >
                  {content}
                </button>
              );
            }

            return (
              <Link key={item.label} href={item.href} className="block">
                {content}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto px-3 pb-4">
          <div className="rounded-2xl border border-white/10 bg-black/30 p-2">
            <div className="flex items-center gap-3 px-2 py-2">
              <Avatar
                imageUrl={me?.user?.avatarUrl || null}
                alt={me?.user?.username || "Usuario"}
                size="md"
              />
              {!collapsed && (
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-white">
                    {loading ? "Cargando…" : authed ? me?.user?.displayName || me?.user?.username : "Invitado"}
                  </div>
                  <div className="truncate text-xs text-white/60">{authed ? `@${me?.user?.username}` : "Inicia sesión"}</div>
                </div>
              )}
            </div>

            <div className="mt-1 flex flex-col">
              {accountItems.map((it) => {
                const content = (
                  <span className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-white/80 transition hover:bg-white/5 hover:text-white">
                    <Icon name={it.icon} />
                    {!collapsed && <span className="truncate">{it.label}</span>}
                  </span>
                );

                if (it.href.startsWith("/logout")) {
                  return (
                    <a key={it.label} href={it.href} className="block">
                      {content}
                    </a>
                  );
                }

                return (
                  <Link key={it.label} href={it.href} className="block">
                    {content}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-black/60 backdrop-blur supports-[backdrop-filter]:bg-black/40"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex items-center justify-around px-3 py-2">
          <Link href="/inicio" className="relative rounded-xl p-2 text-white/90" aria-label="Inicio">
            <Icon name="home" />
          </Link>

          <Link href="/reels" className="relative rounded-xl p-2 text-white/90" aria-label="Reels">
            <Icon name="reels" />
          </Link>

          <button
            type="button"
            onClick={() => requireAuth(pathname || "/inicio", () => setCreateOpen(true))}
            className="relative rounded-2xl border border-white/10 bg-white/5 p-2 text-white/95"
            aria-label="Crear"
            style={{ transform: "translateY(-10px)" }}
          >
            <Icon name="create" />
          </button>

          <button
            type="button"
            onClick={() => requireAuth("/notificaciones", () => router.push("/notificaciones"))}
            className="relative rounded-xl p-2 text-white/90"
            aria-label="Notificaciones"
          >
            <Icon name="notifs" />
            <Badge value={unreadNotifs} />
          </button>

          <button
            type="button"
            onClick={() => requireAuth("/mensajes", () => router.push("/mensajes"))}
            className="relative rounded-xl p-2 text-white/90"
            aria-label="Mensajes"
          >
            <Icon name="messages" />
            <Badge value={unreadMessages} />
          </button>

          <Link href={profileHref} className="relative rounded-xl p-2" aria-label="Perfil">
            {authed ? (
              <Avatar imageUrl={me?.user?.avatarUrl || null} alt={me?.user?.username || "Perfil"} size="sm" />
            ) : (
              <Icon name="profile" />
            )}
          </Link>
        </div>
      </div>

      {/* Modals */}
      <CreatePostModal isOpen={createOpen} onClose={() => setCreateOpen(false)} />
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

function SearchModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-zinc-950/90 p-4 shadow-2xl backdrop-blur">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-white">Buscar</div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80 hover:bg-white/10"
          >
            Cerrar
          </button>
        </div>
        <div className="mt-3">
          <input
            autoFocus
            placeholder="Buscar creadores…"
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/20"
          />
          <div className="mt-3 text-xs text-white/50">Tip: en esta versión el buscador es visual (sin resultados aún).</div>
        </div>
      </div>
    </div>
  );
}

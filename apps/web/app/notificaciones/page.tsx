"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";
import AuthGate from "../../components/AuthGate";
import useMe from "../../hooks/useMe";

type NotificationItem = {
  id: string;
  type: string;
  data: any;
  readAt: string | null;
  createdAt: string;
};

export default function NotificationsPage() {
  const { me, loading: meLoading } = useMe();
  const authed = Boolean(me?.user?.id);

  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      if (!authed) return;
      setLoading(true);
      setError(null);
      try {
        const r = await apiFetch<NotificationItem[]>("/notifications");
        if (!alive) return;
        setItems(Array.isArray(r) ? r : []);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message || "No se pudieron cargar las notificaciones");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    void load();
    return () => {
      alive = false;
    };
  }, [authed]);

  if (meLoading) return <div className="text-white/70">Cargando…</div>;

  if (!authed) {
    return (
      <AuthGate
        nextPath="/notificaciones"
        title="Inicia sesión para ver tus notificaciones"
        subtitle="Las notificaciones están disponibles solo con sesión iniciada."
      />
    );
  }

  if (loading) return <div className="text-white/70">Cargando notificaciones…</div>;

  if (error) {
    return (
      <div className="card p-6">
        <div className="text-lg font-semibold">No se pudieron cargar las notificaciones</div>
        <div className="mt-1 text-sm text-white/70">{error}</div>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="card p-6">
        <h1 className="text-2xl font-semibold">Notificaciones</h1>
        <p className="mt-1 text-sm text-white/70">Actividad y alertas importantes.</p>
      </div>

      <div className="card p-6">
        <div className="grid gap-3">
          {items.map((n) => (
            <div key={n.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold">{n.type}</div>
                <div className="text-xs text-white/50">{new Date(n.createdAt).toLocaleString("es-CL")}</div>
              </div>
              <pre className="mt-2 whitespace-pre-wrap break-words text-xs text-white/70">
                {JSON.stringify(n.data, null, 2)}
              </pre>
            </div>
          ))}

          {!items.length ? <div className="text-sm text-white/60">No tienes notificaciones aún.</div> : null}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

export type MeUser = {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  profileType: string | null;
};

type MeResponse = { user: MeUser | null };

export default function useMe() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    apiFetch<MeResponse>("/auth/me")
      .then((r) => {
        if (!alive) return;
        // If unauthenticated, backend returns { user: null } (200). Normalize to null so
        // the rest of the app can gate requests and avoid 401 spam.
        setMe(r.user ? r : null);
      })
      .catch(() => {
        if (!alive) return;
        setMe(null);
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  return { me, loading };
}

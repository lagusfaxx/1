export type ApiError = { error: string; details?: any };

const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

function normalizeBaseUrl(input: string): string {
  const trimmed = (input || "").trim().replace(/\/+$/, "");
  if (!trimmed) return "http://localhost:3001";
  // If someone sets NEXT_PUBLIC_API_URL to a bare host (api.uzeed.cl), normalize to https.
  if (!/^https?:\/\//i.test(trimmed)) {
    return `https://${trimmed}`.replace(/\/+$/, "");
  }
  // In production we want https when the site is https (common misconfig causes PC vs mobile mismatch).
  if (typeof window !== "undefined") {
    try {
      const u = new URL(trimmed);
      if (window.location.protocol === "https:" && u.protocol === "http:") {
        u.protocol = "https:";
        return u.toString().replace(/\/+$/, "");
      }
      return u.toString().replace(/\/+$/, "");
    } catch {
      return trimmed;
    }
  }
  return trimmed;
}

export const API_URL = normalizeBaseUrl(RAW_API_URL);

export function resolveMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = String(url).trim();
  if (!trimmed) return null;

  // Absolute URL: normalize scheme if needed
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    if (typeof window !== "undefined" && window.location.protocol === "https:" && trimmed.startsWith("http://")) {
      try {
        const u = new URL(trimmed);
        const api = new URL(API_URL);
        // Only upgrade to https when the host matches our API host (avoid breaking external URLs)
        if (u.host === api.host) {
          u.protocol = "https:";
          return u.toString();
        }
      } catch {
        // ignore
      }
    }
    return trimmed;
  }

  // Normalize to /path
  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;

  // Uploads are served by the API under /uploads/*
  if (path.startsWith("/uploads/")) return `${API_URL}${path}`;

  // Some older records may store bare filenames
  if (!path.includes("/")) return `${API_URL}/uploads/${trimmed}`;

  return `${API_URL}${path}`;
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      ...(init?.headers || {}),
      // When sending FormData, do NOT set Content-Type (browser will set boundary).
      ...(init?.body instanceof FormData ? {} : { "Content-Type": "application/json" })
    }
  });

  if (!res.ok) {
    let body: any = null;
    try {
      body = await res.json();
    } catch {
      body = { error: `HTTP_${res.status}` };
    }
    const msg = (body && (body.error || body.message)) || `HTTP_${res.status}`;
    const err: any = new Error(msg);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return (await res.json()) as T;
}


export function isAuthError(err: any): boolean {
  const status = err?.status || err?.response?.status;
  return status === 401 || status === 403;
}

export function authCtaTitle(status?: number): string {
  if (status === 403) return "No tienes permisos para continuar";
  return "Inicia sesión para continuar";
}

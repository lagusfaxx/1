"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { API_URL } from "../lib/api";
import AuthGate from "./AuthGate";
import useMe from "../hooks/useMe";

type CreatePostModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
  defaultMode?: "IMAGE" | "VIDEO";
};

type PreviewItem = { url: string; type: "IMAGE" | "VIDEO" };

const MAX_FILE_SIZE = 100 * 1024 * 1024;

export default function CreatePostModal({ isOpen, onClose, onCreated, defaultMode = "IMAGE" }: CreatePostModalProps) {
  const router = useRouter();
  const pathname = usePathname() || "/inicio";
  const { me, loading } = useMe();
  const authed = Boolean(me?.user);

  const [mode, setMode] = useState<"IMAGE" | "VIDEO">(defaultMode);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [files, setFiles] = useState<FileList | null>(null);
  const [previews, setPreviews] = useState<PreviewItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [unauth, setUnauth] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  const nextPath = useMemo(() => pathname, [pathname]);

  // Hard gate: if the user is not authenticated, don't show a broken modal.
  useEffect(() => {
    if (!isOpen) return;
    if (loading) return;
    if (!authed) {
      onClose();
      router.push(`/login?next=${encodeURIComponent(nextPath)}`);
    }
  }, [isOpen, authed, loading, nextPath, onClose, router]);

  useEffect(() => {
    if (!isOpen) return;
    setMode(defaultMode);
    setTitle("");
    setBody("");
    setIsPublic(false);
    setFiles(null);
    setPreviews([]);
    setError(null);
    setUnauth(false);
    setForbidden(false);
    setProgress(0);
    setUploading(false);
  }, [isOpen, defaultMode]);

  useEffect(() => {
    return () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [previews]);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || !fileList.length) {
      setFiles(null);
      setPreviews([]);
      return;
    }

    const ok = Array.from(fileList).every((file) => {
      if (file.size > MAX_FILE_SIZE) return false;
      if (mode === "IMAGE") return file.type.startsWith("image/");
      return file.type.startsWith("video/");
    });

    if (!ok) {
      setError("Revisa el formato y tamaño del archivo. Máximo 100MB.");
      return;
    }

    setError(null);
    setFiles(fileList);
    const nextPreviews: PreviewItem[] = Array.from(fileList).map((file) => ({
      url: URL.createObjectURL(file),
      type: file.type.startsWith("video/") ? "VIDEO" : "IMAGE"
    }));
    setPreviews(nextPreviews);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!files || !files.length) {
      setError("Selecciona al menos un archivo.");
      return;
    }

    setError(null);
    setUnauth(false);
    setForbidden(false);
    setUploading(true);

    const form = new FormData();
    form.append("title", title.trim() || (mode === "VIDEO" ? "Nuevo reel" : "Nueva publicación"));
    form.append("body", body.trim() || "");
    form.append("isPublic", String(isPublic));
    form.append("price", "0");
    Array.from(files).forEach((file) => form.append("files", file));

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_URL}/posts/mine`);
    xhr.withCredentials = true;
    xhr.upload.onprogress = (evt) => {
      if (evt.lengthComputable) setProgress(Math.round((evt.loaded / evt.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        setProgress(100);
        setUploading(false);
        onCreated?.();
        onClose();
        router.refresh();
        return;
      }

      if (xhr.status === 401) {
        setUnauth(true);
        setError(null);
      } else if (xhr.status === 403) {
        setForbidden(true);
        setError(null);
      } else {
        setError("No se pudo crear la publicación. Intenta nuevamente.");
      }
      setUploading(false);
    };
    xhr.onerror = () => {
      setError("No se pudo conectar con el servidor. Revisa tu conexión y reintenta.");
      setUploading(false);
    };
    xhr.send(form);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 px-4 py-8" onMouseDown={onClose}>
      <div
        className="w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-3xl border border-white/10 bg-uzeed-950/95 shadow-2xl flex flex-col"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div>
            <h2 className="text-base font-semibold">{mode === "VIDEO" ? "Crear reel" : "Crear publicación"}</h2>
            <p className="text-xs text-white/60">Sube una {mode === "VIDEO" ? "pieza vertical" : "foto"} y agrega un texto.</p>
          </div>
          <button className="btn-ghost" onClick={onClose} type="button">
            Cerrar
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="flex flex-wrap gap-2">
            {(["IMAGE", "VIDEO"] as const).map((type) => (
              <button
                key={type}
                type="button"
                className={mode === type ? "btn-primary" : "btn-secondary"}
                onClick={() => {
                  setMode(type);
                  handleFiles(null);
                }}
              >
                {type === "IMAGE" ? "Foto" : "Video"}
              </button>
            ))}
          </div>

          {unauth ? (
            <AuthGate className="mt-5" nextPath={nextPath} title="Inicia sesión para publicar" />
          ) : forbidden ? (
            <div className="mt-5 card p-6 border border-white/10 bg-white/5">
              <div className="text-lg font-semibold">No tienes permisos para publicar</div>
              <div className="mt-1 text-sm text-white/70">Tu tipo de cuenta no puede crear publicaciones por el momento.</div>
            </div>
          ) : (
            <form ref={formRef} onSubmit={submit} className="mt-5 grid gap-4">
              <div className="grid gap-2">
                <label className="text-sm text-white/70">Título</label>
                <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Agrega un título" />
              </div>

              <div className="grid gap-2">
                <label className="text-sm text-white/70">Texto</label>
                <textarea className="input min-h-[120px]" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Escribe algo (opcional)" />
              </div>

              <div className="flex items-center gap-3">
                <input
                  id="isPublicModal"
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="h-4 w-4"
                />
                <label htmlFor="isPublicModal" className="text-sm text-white/70">
                  Público (sin paywall)
                </label>
              </div>

              <div className="grid gap-2">
                <label className="text-sm text-white/70">Archivo</label>

                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept={mode === "IMAGE" ? "image/*" : "video/*"}
                  onChange={(e) => handleFiles(e.target.files)}
                />

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Seleccionar archivo
                  </button>
                  <div className="text-xs text-white/60">
                    {files?.length ? `${files.length} archivo(s) seleccionado(s)` : "JPG, PNG, MP4 • hasta 100MB"}
                  </div>
                </div>
              </div>

              {previews.length ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {previews.map((preview) =>
                    preview.type === "IMAGE" ? (
                      <div key={preview.url} className="rounded-2xl border border-white/10 bg-black/20 overflow-hidden">
                        <img src={preview.url} className="w-full max-h-[360px] object-contain" alt="preview" />
                      </div>
                    ) : (
                      <div key={preview.url} className="rounded-2xl border border-white/10 bg-black/20 overflow-hidden">
                        <video src={preview.url} className="w-full max-h-[360px] object-contain" playsInline controls />
                      </div>
                    )
                  )}
                </div>
              ) : null}

              {uploading ? (
                <div className="mt-1">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <div className="h-full bg-fuchsia-500 transition-all" style={{ width: `${progress}%` }} />
                  </div>
                  <div className="mt-2 text-xs text-white/60">Subiendo… {progress}%</div>
                </div>
              ) : null}

              {error ? (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                  {error}
                </div>
              ) : null}

              {/* Spacer so footer never overlaps content */}
              <div className="h-2" />
            </form>
          )}
        </div>

        {/* Sticky footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-uzeed-950/95">
          <button
            className="btn-primary w-full"
            disabled={!authed || uploading || !!unauth || !!forbidden}
            onClick={() => {
              formRef.current?.requestSubmit?.();
            }}
            type="button"
          >
            {uploading ? `Subiendo… ${progress}%` : "Publicar"}
          </button>
        </div>
      </div>
    </div>
  );
}

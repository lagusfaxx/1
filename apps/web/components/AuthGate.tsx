"use client";

import Link from "next/link";

export default function AuthGate({
  title = "Inicia sesión para continuar",
  subtitle = "Para publicar, comentar o enviar mensajes necesitas una cuenta.",
  className = "",
  nextPath
}: {
  title?: string;
  subtitle?: string;
  className?: string;
  nextPath?: string;
}) {
  const next = nextPath ? `?next=${encodeURIComponent(nextPath)}` : "";
  return (
    <div className={`card p-6 ${className}`}>
      <div className="text-lg font-semibold">{title}</div>
      <div className="mt-1 text-sm text-white/70">{subtitle}</div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href={`/login${next}`} className="btn-primary">
          Ingresar
        </Link>
        <Link href={`/register${next}`} className="btn-secondary">
          Crear cuenta
        </Link>
      </div>
    </div>
  );
}

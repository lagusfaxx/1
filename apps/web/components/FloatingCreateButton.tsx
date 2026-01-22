"use client";

type FloatingCreateButtonProps = {
  onClick: () => void;
};

export default function FloatingCreateButton({ onClick }: FloatingCreateButtonProps) {
  return (
    <button
      className="md:hidden fixed right-5 z-30 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-fuchsia-500 text-2xl text-white shadow-lg transition hover:bg-fuchsia-400"
      style={{ bottom: "calc(env(safe-area-inset-bottom) + 76px)" }}
      onClick={onClick}
      aria-label="Crear publicación"
      type="button"
    >
      +
    </button>
  );
}

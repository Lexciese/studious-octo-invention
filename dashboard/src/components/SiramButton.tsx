"use client";

import type { SiramState } from "@/hooks/useSensorPolling";

interface SiramButtonProps {
  state: SiramState;
  onClick: () => void;
}

const LABELS: Record<SiramState["status"], string> = {
  idle: "SIRAM",
  sending: "Mengirim…",
  queued: "Perintah dikirim",
  error: "Gagal — coba lagi",
};

export function SiramButton({ state, onClick }: SiramButtonProps) {
  const disabled = state.status === "sending";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-busy={disabled}
      className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-600 px-8 py-6 text-left font-semibold text-white shadow-lg shadow-sky-900/40 transition-all hover:from-sky-400 hover:to-cyan-500 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto sm:px-12 sm:py-8"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-sky-100/80">
            Kontrol Irigasi
          </p>
          <p className="mt-1 text-3xl tracking-tight sm:text-4xl">
            {LABELS[state.status]}
          </p>
        </div>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-10 w-10 transition-transform group-hover:scale-110 sm:h-12 sm:w-12"
          aria-hidden="true"
        >
          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
        </svg>
      </div>
      {state.status === "error" && state.error && (
        <p className="mt-3 text-xs text-rose-100">{state.error}</p>
      )}
      {state.lastQueuedAt && (
        <p className="mt-2 text-xs text-sky-100/70">
          Queued {new Date(state.lastQueuedAt).toLocaleTimeString()}
        </p>
      )}
    </button>
  );
}

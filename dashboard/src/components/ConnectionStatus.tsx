"use client";

import type { ConnectionState } from "@/hooks/useSensorPolling";

interface ConnectionStatusProps {
  state: ConnectionState;
}

const MAP: Record<ConnectionState, { label: string; dot: string; ring: string; text: string }> = {
  connecting: {
    label: "Menghubungkan…",
    dot: "bg-zinc-400 animate-pulse",
    ring: "ring-zinc-500/30 bg-zinc-500/10",
    text: "text-zinc-600 dark:text-zinc-300",
  },
  fresh: {
    label: "Terhubung",
    dot: "bg-emerald-500 dark:bg-emerald-400",
    ring: "ring-emerald-500/30 bg-emerald-500/10",
    text: "text-emerald-700 dark:text-emerald-300",
  },
  stale: {
    label: "Sinyal hilang",
    dot: "bg-amber-500 dark:bg-amber-400 animate-pulse",
    ring: "ring-amber-500/30 bg-amber-500/10",
    text: "text-amber-700 dark:text-amber-300",
  },
};

export function ConnectionStatus({ state }: ConnectionStatusProps) {
  const cfg = MAP[state];
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ring-1 ${cfg.ring} ${cfg.text}`}
    >
      <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

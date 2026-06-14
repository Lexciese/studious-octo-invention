import type { ReactNode } from "react";

interface SensorCardProps {
  label: string;
  value: number | null;
  unit: string;
  icon: ReactNode;
  hint?: string;
  accent: "amber" | "sky" | "emerald" | "violet";
}

const ACCENT: Record<SensorCardProps["accent"], string> = {
  amber:
    "bg-amber-500/15 text-amber-700 ring-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/30",
  sky: "bg-sky-500/15 text-sky-700 ring-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-400/30",
  emerald:
    "bg-emerald-500/15 text-emerald-700 ring-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/30",
  violet:
    "bg-violet-500/15 text-violet-700 ring-violet-500/30 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-400/30",
};

export function SensorCard({
  label,
  value,
  unit,
  icon,
  hint,
  accent,
}: SensorCardProps) {
  const display = value === null ? "—" : formatValue(value);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 transition-colors hover:border-zinc-300 dark:border-white/10 dark:bg-zinc-900/60 dark:hover:border-white/20">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            {label}
          </p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
            {display}
            {value !== null && (
              <span className="ml-1 text-base font-normal text-zinc-500 dark:text-zinc-400">
                {unit}
              </span>
            )}
          </p>
        </div>
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-xl ring-1 ${ACCENT[accent]}`}
        >
          {icon}
        </span>
      </div>
      {hint && (
        <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-500">{hint}</p>
      )}
    </div>
  );
}

function formatValue(v: number): string {
  if (Math.abs(v) >= 1000) return Math.round(v).toLocaleString();
  if (Math.abs(v) >= 100) return v.toFixed(0);
  if (Math.abs(v) >= 10) return v.toFixed(1);
  return v.toFixed(2);
}

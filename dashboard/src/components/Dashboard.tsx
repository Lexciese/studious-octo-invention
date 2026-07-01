"use client";

import { useState } from "react";
import { ConnectionStatus } from "./ConnectionStatus";
import { OtaFloatingPanel } from "./OtaFloatingPanel";
import { SensorCard } from "./SensorCard";
import { SiramButton } from "./SiramButton";
import { ThemeToggle } from "./ThemeToggle";
import { useSensorPolling } from "@/hooks/useSensorPolling";

export function Dashboard() {
  const { reading, connection, siram, triggerSiram } = useSensorPolling();
  const [otaPanelOpen, setOtaPanelOpen] = useState(false);

  const pirMotion = reading?.pirActive ?? false;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-sky-600 dark:text-sky-400">
            Smart Farming · IoT
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
            Dashboard Lapangan
          </h1>
          <p className="mt-2 max-w-md text-sm text-zinc-600 dark:text-zinc-400">
            Monitor kelembapan tanah, deteksi gerakan, dan kontrol irigasi dari jarak jauh.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ConnectionStatus state={connection} />
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setOtaPanelOpen(true)}
            aria-label="Pembaruan Firmware"
            title="Pembaruan Firmware"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:border-white/10 dark:bg-zinc-900/60 dark:text-zinc-300 dark:hover:bg-zinc-800/80 dark:hover:text-zinc-50"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
          </button>
        </div>
      </header>

      <OtaFloatingPanel
        open={otaPanelOpen}
        onClose={() => setOtaPanelOpen(false)}
      />

      <section
        aria-label="Sensor readings"
        className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3"
      >
        <SensorCard
          label="Kelembapan Tanah"
          value={reading?.soilMoisturePct ?? null}
          unit="%"
          accent="emerald"
          hint="Siram ketika di bawah 30%"
          icon={<SoilIcon />}
        />
        <SensorCard
          label="Sensor Gerak (PIR)"
          value={reading?.pirActive ?? null}
          accent={pirMotion ? "amber" : "sky"}
          boolLabels={{ true: "Gerakan!", false: "Aman" }}
          hint={pirMotion ? "Gerakan terdeteksi — servo aktif" : "Tidak ada gerakan"}
          icon={<MotionIcon active={pirMotion} />}
        />
        <SensorCard
          label="Pompa Air"
          value={reading?.pumpActive ?? null}
          accent={reading?.pumpActive ? "sky" : "violet"}
          boolLabels={{ true: "Menyala", false: "Mati" }}
          hint={reading?.pumpActive ? "Pompa sedang mengalirkan air" : "Pompa dalam posisi mati"}
          icon={<PumpIcon active={reading?.pumpActive ?? false} />}
        />
      </section>

      <section
        aria-label="Device control"
        className="mt-8 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-white/10 dark:bg-zinc-900/60 sm:p-6"
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
              Kontrol Air
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Tombol ini mengirim perintah siram ke ESP32. Pompa akan menyala selama {5} detik.
            </p>
          </div>
          <SiramButton state={siram} onClick={() => void triggerSiram()} />
        </div>
        {reading?.deviceId && (
          <p className="mt-5 border-t border-zinc-200 pt-4 text-xs text-zinc-500 dark:border-white/5 dark:text-zinc-500">
            Device ID:{" "}
            <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-300">
              {reading.deviceId}
            </code>
          </p>
        )}
      </section>
    </main>
  );
}

function SoilIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M3 16h18" />
      <path d="M5 20h14" />
      <path d="M7 12c2-3 8-3 10 0" />
      <path d="M12 4v6" />
    </svg>
  );
}

function MotionIcon({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-5 w-5 ${active ? "animate-pulse" : ""}`}
      aria-hidden="true"
    >
      <path d="M12 3a4 4 0 0 1 4 4v4a4 4 0 0 1-8 0V7a4 4 0 0 1 4-4z" />
      <path d="M6 11a6 6 0 0 0 12 0" />
      <path d="M12 19v2" />
    </svg>
  );
}

function PumpIcon({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-5 w-5 ${active ? "animate-spin" : ""}`}
      aria-hidden="true"
    >
      <path d="M6 3h12v6a6 6 0 1 1-12 0V3z" />
      <path d="M12 9v3" />
      <rect x="8" y="18" width="8" height="3" rx="1" />
    </svg>
  );
}

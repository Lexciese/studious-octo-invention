"use client";

import { ConnectionStatus } from "./ConnectionStatus";
import { SensorCard } from "./SensorCard";
import { SiramButton } from "./SiramButton";
import { ThemeToggle } from "./ThemeToggle";
import { useSensorPolling } from "@/hooks/useSensorPolling";

export function Dashboard() {
  const { reading, connection, siram, triggerSiram } = useSensorPolling();

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
            Monitor sensor ESP32 real-time dan kontrol irigasi dari jarak jauh.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ConnectionStatus state={connection} />
          <ThemeToggle />
        </div>
      </header>

      <section
        aria-label="Sensor readings"
        className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2"
      >
        <SensorCard
          label="Suhu"
          value={reading?.temperatureC ?? null}
          unit="°C"
          accent="amber"
          hint="Optimal 22–30°C untuk sebagian besar tanaman"
          icon={<ThermoIcon />}
        />
        <SensorCard
          label="Kelembapan Udara"
          value={reading?.humidityPct ?? null}
          unit="%"
          accent="sky"
          hint="Jaga 50–70% untuk pertumbuhan sehat"
          icon={<DropIcon />}
        />
        <SensorCard
          label="Kelembapan Tanah"
          value={reading?.soilMoisturePct ?? null}
          unit="%"
          accent="emerald"
          hint="Siram ketika di bawah 30%"
          icon={<SoilIcon />}
        />
        <SensorCard
          label="Intensitas Cahaya"
          value={reading?.lightLux ?? null}
          unit="lx"
          accent="violet"
          hint="Cahaya matahari penuh ≈ 25000–50000 lx"
          icon={<SunIcon />}
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
              Tombol ini mengirim perintah siram ke ESP32. Perangkat akan
              menjalankannya pada poll berikutnya.
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

function ThermoIcon() {
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
      <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
    </svg>
  );
}

function DropIcon() {
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
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
    </svg>
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

function SunIcon() {
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
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

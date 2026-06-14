import { getLatestReading, setLatestReading } from "./deviceState";
import type { SensorReading } from "./types";

const DEVICE_ID = process.env.DEVICE_ID ?? "smart-farm-01";
const TICK_MS = Number(process.env.MOCK_TICK_MS ?? 2000);
const STALE_AFTER_MS = Number(process.env.STALE_AFTER_MS ?? 10000);

declare global {
  var __mockDeviceStarted: boolean | undefined;
}

function jitter(prev: number, min: number, max: number, step: number): number {
  const delta = (Math.random() - 0.5) * 2 * step;
  const next = prev + delta;
  return Math.max(min, Math.min(max, next));
}

function generateReading(prev: SensorReading | null): SensorReading {
  const base: SensorReading = prev ?? {
    temperatureC: 26,
    humidityPct: 60,
    soilMoisturePct: 45,
    lightLux: 12000,
    deviceId: DEVICE_ID,
    timestamp: Date.now(),
  };

  return {
    temperatureC: +jitter(base.temperatureC, 15, 38, 0.4).toFixed(2),
    humidityPct: +jitter(base.humidityPct, 30, 90, 1.5).toFixed(1),
    soilMoisturePct: +jitter(base.soilMoisturePct, 10, 80, 1.2).toFixed(1),
    lightLux: Math.round(jitter(base.lightLux, 0, 60000, 800)),
    deviceId: DEVICE_ID,
    timestamp: Date.now(),
  };
}

export function ensureMockDevice(): void {
  if (process.env.MOCK_DEVICE === "false") return;
  if (process.env.NODE_ENV === "production") return;
  if (globalThis.__mockDeviceStarted) return;
  globalThis.__mockDeviceStarted = true;

  setLatestReading(generateReading(getLatestReading()));

  setInterval(() => {
    setLatestReading(generateReading(getLatestReading()));
  }, TICK_MS);

  console.log(
    `[mockDevice] simulating ESP32 "${DEVICE_ID}" every ${TICK_MS}ms`
  );
}

export const STALE_MS = STALE_AFTER_MS;

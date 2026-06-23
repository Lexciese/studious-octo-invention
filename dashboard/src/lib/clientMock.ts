import type { SensorReading, SiramTriggerResponse } from "./types";

const DEVICE_ID = "smart-farm-mock";
const PREV: SensorReading = {
  temperatureC: 26,
  humidityPct: 60,
  soilMoisturePct: 45,
  lightLux: 12000,
  deviceId: DEVICE_ID,
  timestamp: 0,
};

function jitter(prev: number, min: number, max: number, step: number): number {
  const delta = (Math.random() - 0.5) * 2 * step;
  const next = prev + delta;
  return Math.max(min, Math.min(max, next));
}

export function mockSensorReading(): SensorReading {
  PREV.temperatureC = +jitter(PREV.temperatureC, 15, 38, 0.4).toFixed(2);
  PREV.humidityPct = +jitter(PREV.humidityPct, 30, 90, 1.5).toFixed(1);
  PREV.soilMoisturePct = +jitter(PREV.soilMoisturePct, 10, 80, 1.2).toFixed(1);
  PREV.lightLux = Math.round(jitter(PREV.lightLux, 0, 60000, 800));
  PREV.timestamp = Date.now();
  return { ...PREV };
}

export function mockSiramResponse(): SiramTriggerResponse {
  return { ok: true, queuedAt: Date.now() };
}

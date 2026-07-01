import type { SensorReading, SiramTriggerResponse } from "./types";

const DEVICE_ID = "smart-farm-mock";

export function mockSensorReading(): SensorReading {
  // ponytail: simple jitter-free mock. Static values with occasional toggle
  // for PIR to demonstrate the motion card.
  // Ceiling: add jittered soil moisture for more realistic dev experience.
  const now = Date.now();
  const pirToggle = Math.floor(now / 5000) % 2 === 0; // toggles every 5s

  return {
    soilMoisturePct: 42,
    pirActive: pirToggle,
    pumpActive: false,
    deviceId: DEVICE_ID,
    timestamp: now,
  };
}

export function mockSiramResponse(): SiramTriggerResponse {
  return { ok: true, queuedAt: Date.now() };
}

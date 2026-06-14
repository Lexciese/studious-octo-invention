export interface SensorReading {
  temperatureC: number;
  humidityPct: number;
  soilMoisturePct: number;
  lightLux: number;
  deviceId: string;
  timestamp: number;
}

/**
 * Response shape for GET /api/sensors.
 *
 * `receivedAt` is the dashboard server's epoch-ms timestamp of when it last
 * received a reading from the device (via POST /api/sensors/ingest or the mock
 * device). Use this — NOT `reading.timestamp` — for staleness checks: ESP32
 * devices without an RTC produce meaningless timestamps (uptime since boot).
 */
export interface SensorsResponse {
  reading: SensorReading | null;
  receivedAt: number | null;
}

export interface SiramCommand {
  queuedAt: number;
  source: "web" | "esp32" | "system";
}

export interface SiramTriggerBody {
  source?: "web" | "esp32" | "system";
}

export interface SiramTriggerResponse {
  ok: boolean;
  queued: boolean;
  queuedAt: number;
}

export interface SiramCommandResponse {
  pending: boolean;
  queuedAt?: number;
}

export interface SensorReading {
  soilMoisturePct: number;
  pirActive: boolean;
  pumpActive: boolean;
  deviceId: string;
  timestamp: number;
}

export interface SiramTriggerBody {
  source?: "web" | "esp32" | "system";
}

export interface SiramTriggerResponse {
  ok: boolean;
  queuedAt: number;
}

// ─── OTA ─────────────────────────────────────────────────────────────────────

export interface OtaStatusResponse {
  state: "idle" | "connecting" | "downloading" | "complete" | "error";
  progress: number;
  error?: string;
}

export interface OtaTriggerBody {
  url: string;
}

export interface OtaTriggerResponse {
  ok: boolean;
  error?: string;
}

export interface SensorReading {
  temperatureC: number;
  humidityPct: number;
  soilMoisturePct: number;
  lightLux: number;
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

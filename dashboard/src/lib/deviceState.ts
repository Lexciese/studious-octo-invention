import type { SensorReading, SiramCommand } from "./types";

type State = {
  latest: SensorReading | null;
  receivedAt: number | null;
  pendingCommand: SiramCommand | null;
};

const state: State = {
  latest: null,
  receivedAt: null,
  pendingCommand: null,
};

export function getLatestReading(): SensorReading | null {
  return state.latest;
}

export function getReceivedAt(): number | null {
  return state.receivedAt;
}

/**
 * Store a new reading. `receivedAt` is stamped here using the dashboard's own
 * clock — do NOT trust `reading.timestamp` from the device, which may be
 * uptime-since-boot on devices without an RTC (e.g., ESP32 in AP-only mode).
 */
export function setLatestReading(reading: SensorReading): void {
  state.latest = reading;
  state.receivedAt = Date.now();
}

export function queueSiramCommand(source: SiramCommand["source"]): SiramCommand {
  const cmd: SiramCommand = { queuedAt: Date.now(), source };
  state.pendingCommand = cmd;
  return cmd;
}

export function consumeSiramCommand(): SiramCommand | null {
  const cmd = state.pendingCommand;
  state.pendingCommand = null;
  return cmd;
}

export function peekSiramCommand(): SiramCommand | null {
  return state.pendingCommand;
}

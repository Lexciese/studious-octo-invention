"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SensorReading, SensorsResponse } from "@/lib/types";

const POLL_MS = Number(process.env.NEXT_PUBLIC_POLL_INTERVAL_MS ?? 2000);
const STALE_MS = Number(process.env.NEXT_PUBLIC_STALE_AFTER_MS ?? 10000);
// Number of consecutive failed polls before flipping to "stale". Absorbs
// transient network blips without flickering the status pill.
const FAIL_THRESHOLD = 2;

export type ConnectionState = "connecting" | "fresh" | "stale";

export interface SiramState {
  status: "idle" | "sending" | "queued" | "error";
  lastQueuedAt: number | null;
  error: string | null;
}

export interface UseSensorPolling {
  reading: SensorReading | null;
  connection: ConnectionState;
  siram: SiramState;
  triggerSiram: () => Promise<void>;
}

export function useSensorPolling(): UseSensorPolling {
  const [reading, setReading] = useState<SensorReading | null>(null);
  const [connection, setConnection] = useState<ConnectionState>("connecting");
  const [siram, setSiram] = useState<SiramState>({
    status: "idle",
    lastQueuedAt: null,
    error: null,
  });
  const siramResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const failCount = useRef(0);

  const tick = useCallback(async () => {
    try {
      const res = await fetch("/api/sensors", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as SensorsResponse;

      failCount.current = 0;
      setReading(data.reading);

      // Use the dashboard's receivedAt (reliable) — NOT reading.timestamp,
      // which on devices without an RTC (ESP32 in AP mode) is uptime-since-boot.
      const age = data.receivedAt ? Date.now() - data.receivedAt : Infinity;
      setConnection(age > STALE_MS ? "stale" : "fresh");
    } catch {
      failCount.current += 1;
      if (failCount.current >= FAIL_THRESHOLD) {
        setConnection("stale");
      }
    }
  }, []);

  useEffect(() => {
    // Initial fetch so the dashboard shows data immediately instead of after the first tick.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void tick();
    const id = setInterval(tick, POLL_MS);
    return () => clearInterval(id);
  }, [tick]);

  const triggerSiram = useCallback(async () => {
    setSiram({ status: "sending", lastQueuedAt: null, error: null });
    try {
      const res = await fetch("/api/siram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "web" }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { queuedAt: number };
      setSiram({
        status: "queued",
        lastQueuedAt: data.queuedAt,
        error: null,
      });
    } catch (err) {
      setSiram({
        status: "error",
        lastQueuedAt: null,
        error: err instanceof Error ? err.message : "unknown error",
      });
    } finally {
      if (siramResetTimer.current) clearTimeout(siramResetTimer.current);
      siramResetTimer.current = setTimeout(() => {
        setSiram({ status: "idle", lastQueuedAt: null, error: null });
      }, 3000);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (siramResetTimer.current) clearTimeout(siramResetTimer.current);
    };
  }, []);

  return { reading, connection, siram, triggerSiram };
}

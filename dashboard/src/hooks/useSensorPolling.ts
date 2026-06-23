"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { mockSensorReading, mockSiramResponse } from "@/lib/clientMock";
import type { SensorReading, SiramTriggerResponse } from "@/lib/types";

const POLL_MS = Number(process.env.NEXT_PUBLIC_POLL_INTERVAL_MS ?? 2000);
// Number of consecutive failed polls before flipping to "stale". Absorbs
// transient network blips without flickering the status pill.
const FAIL_THRESHOLD = 2;
const USE_CLIENT_MOCK =
  process.env.NEXT_PUBLIC_USE_CLIENT_MOCK === "true";

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
    if (USE_CLIENT_MOCK) {
      setReading(mockSensorReading());
      failCount.current = 0;
      setConnection("fresh");
      return;
    }
    try {
      const res = await fetch("/api/sensors", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as SensorReading | null;
      failCount.current = 0;
      setReading(data);
      setConnection("fresh");
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
      let data: SiramTriggerResponse;
      if (USE_CLIENT_MOCK) {
        data = mockSiramResponse();
      } else {
        const res = await fetch("/api/siram", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ source: "web" }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        data = (await res.json()) as SiramTriggerResponse;
      }
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

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { OtaStatusResponse } from "@/lib/types";

const POLL_MS = 1000;

const ACTIVE_STATES = new Set(["connecting", "downloading"]);

export type OtaUiPhase = "idle" | "sending" | "downloading" | "complete" | "error";

export interface OtaUiState {
  phase: OtaUiPhase;
  progress: number;
  error: string | null;
}

const INITIAL: OtaUiState = {
  phase: "idle",
  progress: 0,
  error: null,
};

export function useOtaUpdate() {
  const [ui, setUi] = useState<OtaUiState>(INITIAL);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollTimer.current !== null) {
      clearInterval(pollTimer.current);
      pollTimer.current = null;
    }
  }, []);

  const poll = useCallback(async () => {
    try {
      const res = await fetch("/api/ota/status", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as OtaStatusResponse;

      switch (data.state) {
        case "idle":
          setUi(INITIAL);
          stopPolling();
          break;
        case "connecting":
        case "downloading":
          setUi({ phase: "downloading", progress: data.progress, error: null });
          break;
        case "complete":
          setUi({ phase: "complete", progress: 100, error: null });
          stopPolling();
          break;
        case "error":
          setUi({ phase: "error", progress: data.progress, error: data.error ?? "Unknown error" });
          stopPolling();
          break;
      }
    } catch (err) {
      setUi({
        phase: "error",
        progress: 0,
        error: err instanceof Error ? err.message : "Poll failed",
      });
      stopPolling();
    }
  }, [stopPolling]);

  useEffect(() => () => stopPolling(), [stopPolling]);

  const triggerUpdate = useCallback(
    async (url: string) => {
      setUi({ phase: "sending", progress: 0, error: null });

      try {
        const res = await fetch("/api/ota", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });

        if (!res.ok) {
          const body = (await res.json()) as { error?: string };
          setUi({
            phase: "error",
            progress: 0,
            error: body.error ?? `Server returned ${res.status}`,
          });
          return;
        }

        // Start polling status
        pollTimer.current = setInterval(poll, POLL_MS);
      } catch (err) {
        setUi({
          phase: "error",
          progress: 0,
          error: err instanceof Error ? err.message : "Network error",
        });
      }
    },
    [poll],
  );

  const reset = useCallback(() => {
    stopPolling();
    setUi(INITIAL);
  }, [stopPolling]);

  return { ui, triggerUpdate, reset };
}

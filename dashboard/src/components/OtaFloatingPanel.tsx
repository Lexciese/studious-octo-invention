"use client";

import { useOtaUpdate } from "@/hooks/useOtaUpdate";
import {
  type FormEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

type UploadTab = "url" | "upload";

interface OtaFloatingPanelProps {
  open: boolean;
  onClose: () => void;
}

// ─── Upload state machine ────────────────────────────────────────────────────

type UploadPhase = "idle" | "uploading" | "complete" | "error";

interface UploadState {
  phase: UploadPhase;
  progress: number;
  error: string | null;
}

const UPLOAD_INIT: UploadState = {
  phase: "idle",
  progress: 0,
  error: null,
};

export function OtaFloatingPanel({ open, onClose }: OtaFloatingPanelProps) {
  const { ui, triggerUpdate, reset } = useOtaUpdate();
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [tab, setTab] = useState<UploadTab>("url");
  const [upload, setUpload] = useState<UploadState>(UPLOAD_INIT);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Focus the URL input when the panel opens on URL tab
  useEffect(() => {
    if (open && tab === "url" && ui.phase === "idle") {
      const t = setTimeout(() => inputRef.current?.focus(), 150);
      return () => clearTimeout(t);
    }
  }, [open, tab, ui.phase]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Reset UI state when panel closes
  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        reset();
        setUpload(UPLOAD_INIT);
        setSelectedFile(null);
      }, 300);
      return () => clearTimeout(t);
    }
  }, [open, reset]);

  // ── URL tab ──────────────────────────────────────────────────────────────

  const validateUrl = useCallback((value: string): string | null => {
    const v = value.trim();
    if (!v) return "URL tidak boleh kosong";
    if (!v.startsWith("http://") && !v.startsWith("https://"))
      return "URL harus dimulai dengan http:// atau https://";
    try {
      new URL(v);
    } catch {
      return "URL tidak valid";
    }
    if (!v.includes(".bin") && !v.match(/\/[^/]+\.[^/]+$/))
      return "URL harus menunjuk ke file firmware (.bin)";
    return null;
  }, []);

  const handleUrlSubmit = useCallback(
    (e?: FormEvent) => {
      e?.preventDefault();
      const err = validateUrl(url);
      setUrlError(err);
      if (err) return;
      void triggerUpdate(url.trim());
    },
    [url, validateUrl, triggerUpdate],
  );

  const handleUrlKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleUrlSubmit();
      }
    },
    [handleUrlSubmit],
  );

  // ── Upload tab ───────────────────────────────────────────────────────────

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] ?? null;
      if (file && !file.name.endsWith(".bin")) {
        setUpload({ phase: "error", progress: 0, error: "File harus .bin" });
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setUpload(UPLOAD_INIT);
    },
    [],
  );

  const handleFileUpload = useCallback(() => {
    if (!selectedFile) return;

    setUpload({ phase: "uploading", progress: 0, error: null });

    const formData = new FormData();
    formData.append("file", selectedFile);

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        setUpload((prev) => ({
          ...prev,
          progress: Math.round((e.loaded * 100) / e.total),
        }));
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        setUpload({ phase: "complete", progress: 100, error: null });
      } else {
        let msg = `HTTP ${xhr.status}`;
        try {
          const body = JSON.parse(xhr.responseText) as { error?: string };
          if (body.error) msg = body.error;
        } catch {
          // use fallback
        }
        setUpload({ phase: "error", progress: 0, error: msg });
      }
    });

    xhr.addEventListener("error", () => {
      setUpload({
        phase: "error",
        progress: 0,
        error: "Gagal mengunggah — periksa koneksi",
      });
    });

    xhr.addEventListener("abort", () => {
      setUpload({ phase: "error", progress: 0, error: "Pengunggahan dibatalkan" });
    });

    xhr.open("POST", "/api/ota/upload");
    xhr.send(formData);
  }, [selectedFile]);

  // ── Render ──────────────────────────────────────────────────────────────

  const urlIsSubmittable =
    (ui.phase === "idle" || ui.phase === "error") && !urlError;

  const tabClasses = (t: UploadTab) =>
    `flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
      tab === t
        ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
        : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
    }`;

  return (
    <>
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Tutup panel"
        onClick={onClose}
        className={`fixed inset-0 z-40 transition-all duration-300 ${
          open
            ? "pointer-events-auto bg-black/40 backdrop-blur-sm"
            : "pointer-events-none bg-transparent backdrop-blur-none"
        }`}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Pembaruan Perangkat Lunak"
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col border-l border-zinc-200/80 bg-white/95 shadow-2xl backdrop-blur-xl transition-transform duration-300 ease-out dark:border-white/10 dark:bg-zinc-950/95 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-white/10">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            </span>
            <div>
              <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Pembaruan Firmware
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-500">
                OTA Update
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-5">

          {/* ── Tab Switcher ── */}
          <div className="flex rounded-lg bg-zinc-100 p-0.5 dark:bg-zinc-900/60">
            <button type="button" className={tabClasses("url")} onClick={() => setTab("url")}>
              URL
            </button>
            <button
              type="button"
              className={tabClasses("upload")}
              onClick={() => setTab("upload")}
            >
              Unggah
            </button>
          </div>

          {/* ── URL Tab ─────────────────────────────────────────────── */}
          {tab === "url" && (
            <>
              {/* Status / progress from URL-based OTA */}
              {ui.phase === "downloading" && <OtaProgressBar progress={ui.progress} />}
              {ui.phase === "complete" && <OtaComplete />}
              {ui.phase === "error" && (
                <OtaError
                  message={ui.error ?? "Gagal"}
                  onRetry={() => {
                    reset();
                    setUrl("");
                  }}
                />
              )}

              {/* URL form (idle + sending) */}
              {(ui.phase === "idle" || ui.phase === "sending") && (
                <form onSubmit={handleUrlSubmit} className="flex flex-col gap-3">
                  <label
                    htmlFor="ota-url"
                    className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-500"
                  >
                    URL Firmware
                  </label>
                  <input
                    ref={inputRef}
                    id="ota-url"
                    type="url"
                    placeholder="https://example.com/firmware.bin"
                    value={url}
                    onChange={(e) => {
                      setUrl(e.target.value);
                      if (urlError) setUrlError(null);
                    }}
                    onKeyDown={handleUrlKeyDown}
                    disabled={ui.phase === "sending"}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 font-mono text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-zinc-900/80 dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:focus:border-sky-400 dark:focus:ring-sky-400/20"
                  />
                  {urlError && (
                    <p className="text-xs text-rose-600 dark:text-rose-400">
                      {urlError}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={ui.phase === "sending" || !url.trim() || !!urlError}
                    className="mt-1 inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
                  >
                    {ui.phase === "sending" ? (
                      <>
                        <SpinnerIcon />
                        Mengirim…
                      </>
                    ) : (
                      <>
                        <DownloadIcon />
                        Perbarui Firmware
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Description (idle only) */}
              {ui.phase === "idle" && (
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-white/10 dark:bg-zinc-900/60">
                  <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                    Masukkan URL file firmware <code className="rounded bg-zinc-200/80 px-1 font-mono text-xs dark:bg-zinc-800">.bin</code>{" "}
                    untuk memperbarui ESP32. Proses unduh akan berjalan di latar
                    belakang — jangan matikan daya ESP32 selama pembaruan.
                  </p>
                </div>
              )}

              {/* Log area for download progress */}
              {ui.phase === "downloading" && (
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 font-mono text-xs leading-relaxed dark:border-white/10 dark:bg-zinc-900/60">
                  <p className="text-emerald-600 dark:text-emerald-400">
                    {">"} Mengunduh firmware...
                  </p>
                  <p className="text-zinc-500">
                    {">"} {ui.progress}% selesai
                  </p>
                  <p className="mt-1 text-zinc-400">
                    {">"} Jangan matikan ESP32
                  </p>
                </div>
              )}
            </>
          )}

          {/* ── Upload Tab ──────────────────────────────────────────── */}
          {tab === "upload" && (
            <>
              {/* Upload progress */}
              {upload.phase === "uploading" && (
                <OtaProgressBar progress={upload.progress} label="Mengunggah firmware..." />
              )}

              {/* Complete */}
              {upload.phase === "complete" && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center dark:border-emerald-500/20 dark:bg-emerald-950/30">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mx-auto h-8 w-8 text-emerald-600 dark:text-emerald-400"
                    aria-hidden="true"
                  >
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                    <path d="M22 4L12 14.01l-3-3" />
                  </svg>
                  <p className="mt-3 text-sm font-medium text-emerald-800 dark:text-emerald-300">
                    Firmware berhasil diunggah
                  </p>
                  <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
                    ESP32 akan restart dalam beberapa detik...
                  </p>
                </div>
              )}

              {/* Error */}
              {upload.phase === "error" && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-500/20 dark:bg-rose-950/30">
                  <div className="flex items-start gap-3">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mt-0.5 h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400"
                      aria-hidden="true"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M15 9l-6 6M9 9l6 6" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-rose-800 dark:text-rose-300">
                        Gagal mengunggah
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-rose-600 dark:text-rose-400">
                        {upload.error}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setUpload(UPLOAD_INIT);
                          setSelectedFile(null);
                        }}
                        className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-medium text-rose-700 transition-colors hover:bg-rose-50 dark:border-rose-500/30 dark:bg-zinc-900 dark:text-rose-300 dark:hover:bg-rose-950/50"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-3.5 w-3.5"
                          aria-hidden="true"
                        >
                          <path d="M3 12a9 9 0 019-9 9.75 9.75 0 016.74 2.74L21 8" />
                          <path d="M21 3v5h-5" />
                        </svg>
                        Coba Lagi
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* File picker (idle + error states) */}
              {(upload.phase === "idle" || upload.phase === "error") && (
                <div className="flex flex-col gap-4">
                  {/* Drop zone */}
                  <label
                    htmlFor="ota-file"
                    className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 px-5 py-10 transition-colors hover:border-zinc-300 hover:bg-zinc-100 dark:border-white/10 dark:bg-zinc-900/60 dark:hover:border-white/20 dark:hover:bg-zinc-900/80"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-8 w-8 text-zinc-400 dark:text-zinc-500"
                      aria-hidden="true"
                    >
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                    </svg>
                    <div className="text-center">
                      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        {selectedFile ? selectedFile.name : "Pilih file .bin"}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
                        {selectedFile
                          ? `${(selectedFile.size / 1024).toFixed(0)} KB`
                          : "Klik untuk memilih file firmware"}
                      </p>
                    </div>
                    <input
                      ref={fileInputRef}
                      id="ota-file"
                      type="file"
                      accept=".bin"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>

                  {selectedFile && (
                    <button
                      type="button"
                      onClick={handleFileUpload}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
                    >
                      <UploadIcon />
                      Unggah &amp; Flash
                    </button>
                  )}

                  <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-white/10 dark:bg-zinc-900/60">
                    <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                      Pilih file <code className="rounded bg-zinc-200/80 px-1 font-mono text-xs dark:bg-zinc-800">.bin</code>{" "}
                      dari komputer Anda. File akan langsung di-flash ke ESP32 —
                      jangan matikan daya selama proses.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function OtaProgressBar({
  progress,
  label,
}: {
  progress: number;
  label?: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-white/10 dark:bg-zinc-900/60">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
          {label ?? "Mengunduh firmware..."}
        </span>
        <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
          {progress}%
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}

function OtaComplete() {
  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center dark:border-emerald-500/20 dark:bg-emerald-950/30">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="mx-auto h-8 w-8 text-emerald-600 dark:text-emerald-400"
        aria-hidden="true"
      >
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
        <path d="M22 4L12 14.01l-3-3" />
      </svg>
      <p className="mt-3 text-sm font-medium text-emerald-800 dark:text-emerald-300">
        Firmware berhasil diunduh
      </p>
      <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
        ESP32 akan restart dalam beberapa detik...
      </p>
    </div>
  );
}

function OtaError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-500/20 dark:bg-rose-950/30">
      <div className="flex items-start gap-3">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mt-0.5 h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M15 9l-6 6M9 9l6 6" />
        </svg>
        <div>
          <p className="text-sm font-medium text-rose-800 dark:text-rose-300">
            Gagal memperbarui
          </p>
          <p className="mt-1 text-xs leading-relaxed text-rose-600 dark:text-rose-400">
            {message}
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-medium text-rose-700 transition-colors hover:bg-rose-50 dark:border-rose-500/30 dark:bg-zinc-900 dark:text-rose-300 dark:hover:bg-rose-950/50"
          >
            <RetryIcon />
            Coba Lagi
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Inline SVG Icons ────────────────────────────────────────────────────────

function SpinnerIcon() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
    </svg>
  );
}

function RetryIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5"
      aria-hidden="true"
    >
      <path d="M3 12a9 9 0 019-9 9.75 9.75 0 016.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
    </svg>
  );
}

# Dashboard — Next.js Web App for Smart Farming

## Purpose

Next.js web dashboard for the Smart Farming system. Displays live ESP32 sensor readings (temperature, humidity, soil moisture, light) and exposes the "SIRAM" irrigation control button. Built as a static export and flashed onto the ESP32's LittleFS — the ESP32 serves it directly to browsers on its hotspot (`http://192.168.4.1/`). The browser polls same-origin `/api/sensors` and POSTs same-origin `/api/siram`; the ESP32 is both the static file host and the API server.

## Ownership

**Owner**: lexciese
**Parent**: [Root AGENTS.md](../AGENTS.md)

## Local Contracts

### Critical — Next.js 16 Rules (from create-next-app)

<!-- BEGIN:nextjs-agent-rules -->
This version of Next.js has breaking changes — APIs, conventions, and file structure may all differ from older training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing or modifying Next.js-specific code (layouts, metadata, caching, client components, static export). Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

### REST Contract (browser ↔ ESP32, same-origin)

All JSON, all under `http://192.168.4.1/`. No broker, no CORS, no mixed content.

**Sensors**
- `GET /api/sensors` → `SensorReading | null` — ESP32 reads sensors on-demand per request (no caching) and serializes via `json_helpers.h`. Browser polls every ~2s.

**SIRAM**
- `POST /api/siram` body: `{ source?: "web" | "esp32" | "system" }` → `{ ok: true, queuedAt: <uptime-ms> }` — ESP32 latches relay+LED on immediately and returns. The `queued`/`pending` fields from the old broker contract are gone; the ESP32 is the executor, not a queue.

### Staleness Semantics (no server-stamped timestamps)

The ESP32 has no RTC, so no epoch-ms timestamps cross the wire. Connection state is derived **purely from the browser's perspective**:
- Any successful poll → `fresh`.
- `FAIL_THRESHOLD` (2) consecutive failures → `stale`.

`SensorReading.timestamp` exists in the type for forward compatibility (future RTC-equipped devices) but is **not used** for staleness today. Do not add server-stamped fields back without an epoch source.

### Source of Truth for Shapes

`src/lib/types.ts` defines `SensorReading` and the response shapes. Update this file when changing any contract; the firmware mirrors it in `firmware/src/types.h`.

### Client Mock (dev-only)

`src/lib/clientMock.ts` simulates an ESP32 in the browser. Active when `NEXT_PUBLIC_USE_CLIENT_MOCK=true` (set automatically by `npm run dev` and `npm run build`). Generates jittered readings on each poll and acks SIRAM POSTs with `Date.now()` as `queuedAt`. Disabled by `npm run build:esp` so the production static export fetches from the real ESP32.

### Build Modes

- `npm run dev` — Next.js dev server with the client mock active. Hot reload, no ESP32 needed.
- `npm run build` — Next.js production server build. Kept for compatibility; not used in production. Will fail if the dev mock path can't resolve, but should otherwise compile.
- `npm run build:esp` — Sets `BUILD_TARGET=esp` and `NEXT_PUBLIC_USE_CLIENT_MOCK=false`, enables `output: 'export'` in `next.config.ts`, and writes static HTML/CSS/JS to `out/`. This is what gets bundled into firmware LittleFS.

## Work Guidance

### Layout

- `src/app/` — App Router pages only. No API routes — the ESP32 serves the API now. (Previous `/api/*` routes were deleted with the broker.)
- `src/components/` — React components (`Dashboard` is the client orchestrator).
- `src/hooks/` — Client hooks (`useSensorPolling` owns the polling loop and SIRAM trigger state machine).
- `src/lib/` — Pure logic: `types.ts`, `clientMock.ts`.

### Polling Loop

- Browser polls `/api/sensors` every `NEXT_PUBLIC_POLL_INTERVAL_MS` (default 2000). Relative path — works same-origin when the ESP32 serves the page.
- Each successful poll → `fresh`; `failCount.current += 1` on failure. After `FAIL_THRESHOLD` (2) consecutive failures → `stale`. A single transient blip doesn't flicker the pill.
- When `NEXT_PUBLIC_USE_CLIENT_MOCK=true`, the hook skips `fetch` and calls `mockSensorReading()` / `mockSiramResponse()` directly — useful for `npm run dev` without hardware.
- SIRAM trigger POSTs `/api/siram` immediately on click and shows an optimistic `queued` state for 3s before resetting.

### Static Export Constraints

When adding features, anything that requires server-side execution breaks `npm run build:esp`:
- No API route handlers (`src/app/api/**`). The ESP32 owns the API.
- No `cookies()`, `headers()`, `draftMode()`, `force-dynamic` in any component.
- No `next/image` with remote patterns (use `images: { unoptimized: true }`, already configured in `next.config.ts`).
- `next/font/google` works — fonts are inlined at build time. Build machine needs internet.

### UI

- Mobile-first Tailwind. Cards stack to one column under `sm`. The SIRAM button must remain reachable without scrolling on common phone widths.
- Indonesian copy is the default (`SIRAM`, `Menghubungkan…`, etc.) since the target audience is Indonesian hobbyist farmers.
- Light/dark theming uses Tailwind's class-based `dark:` variant (configured via `@custom-variant dark` in `src/app/globals.css`). The `.dark` class lives on `<html>`. Default to system preference (`prefers-color-scheme`); persist the user's manual choice in `localStorage` under the key `theme`. A blocking inline script in `src/app/layout.tsx` reads storage and sets the class before paint to avoid FOUC. `suppressHydrationWarning` on `<html>` is required because the script mutates the className after server render. When adding components, write light-mode utility classes as the default and append `dark:` variants — do not hard-code one theme.
- Inline scripts **must** go through the `InlineScript` helper (`src/components/InlineScript.tsx`). It renders `type="text/javascript"` on the server (so the browser runs it during HTML parsing) and `type="text/plain"` on the client (so React doesn't try to re-execute on hydration), with `suppressHydrationWarning`. Raw `<script>` tags in components trigger a Next.js 16 error.
- Client components that read external/DOM state (themes, persisted UI) must use a **stable initial state** that matches the server, then sync via `useEffect`. Reading from `document` in a `useState` initializer causes hydration mismatches because the value differs between SSR and client. See `useTheme` and `ThemeToggle` (`ready` flag) for the pattern.

## Verification

- `npm run build:esp` from `dashboard/` — must produce `out/index.html` and `out/_next/static/**` with no TypeScript or ESLint errors.
- `npm run dev` → open `http://localhost:3000`, sensor cards must update every ~2s from the client mock; SIRAM button transitions through sending→queued→idle.
- End-to-end with hardware: see `firmware/README.md`.

## Child DOX Index

No child AGENTS.md files yet.

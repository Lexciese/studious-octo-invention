# Dashboard — Next.js Web App for Smart Farming

## Purpose

Next.js web dashboard for the Smart Farming system. Displays live ESP32 sensor readings (temperature, humidity, soil moisture, light), exposes the "SIRAM" irrigation control button, and brokers state between the browser and ESP32 via REST polling. Designed to run on the local network so the ESP32 can push readings and poll for commands using the same endpoints.

## Ownership

**Owner**: lexciese
**Parent**: [Root AGENTS.md](../AGENTS.md)

## Local Contracts

### Critical — Next.js 16 Rules (from create-next-app)

<!-- BEGIN:nextjs-agent-rules -->
This version of Next.js has breaking changes — APIs, conventions, and file structure may all differ from older training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing or modifying Next.js-specific code (route handlers, layouts, metadata, caching, server components). Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

### REST Contract (broker between browser and ESP32)

All JSON. Endpoints are forward-compatible — the real ESP32 implements the same contract.

**Sensors**
- `GET  /api/sensors` → `SensorsResponse = { reading: SensorReading | null, receivedAt: number | null }` — latest known reading plus the dashboard server's epoch-ms receive timestamp (browser polls every ~2s). Use `receivedAt` — NOT `reading.timestamp` — for staleness: ESP32 devices without an RTC produce meaningless timestamps (uptime since boot).
- `POST /api/sensors/ingest` body: `SensorReading` → `204 No Content` — ESP32 pushes a new reading. `receivedAt` is stamped server-side here, not by the device.

**SIRAM**
- `POST /api/siram` body: `{ source?: "web" | "esp32" | "system" }` → `{ ok, queued, queuedAt }` — browser (or any client) queues a command.
- `GET  /api/siram/command` → `{ pending: false } | { pending: true, queuedAt }` — ESP32 polls; backend returns **and clears** the pending command atomically on read.

### Source of Truth for Shapes

`src/lib/types.ts` defines `SensorReading`, `SiramCommand`, and the response wrappers. Update this file when changing any contract; the ESP32 firmware (when added) must mirror it.

### State Broker

`src/lib/deviceState.ts` is an in-memory singleton holding the latest reading and a single pending SIRAM command. Stateless processes / serverless will not work without replacing this with shared storage (Redis, DB, or sticky sessions).

### Mock Device

`src/lib/mockDevice.ts` simulates an ESP32 in dev only (`NODE_ENV !== 'production'` and `MOCK_DEVICE !== 'false'`). It ticks every `MOCK_TICK_MS` ms and writes jittered readings into `deviceState`. Guards against double-start via `globalThis.__mockDeviceStarted` to survive Next.js dev hot reload.

## Work Guidance

### Layout

- `src/app/` — App Router pages and route handlers.
- `src/components/` — React components (`Dashboard` is the client orchestrator).
- `src/hooks/` — Client hooks (`useSensorPolling` owns the polling loop and SIRAM trigger state machine).
- `src/lib/` — Pure logic: types, state broker, mock device.

### Polling Loop

- Browser polls `/api/sensors` every `NEXT_PUBLIC_POLL_INTERVAL_MS` (default 2000).
- Each tick derives connection state from `receivedAt`: age > `NEXT_PUBLIC_STALE_AFTER_MS` (default 10000) → `stale`, otherwise `fresh`. There is no separate watchdog effect.
- A failed poll increments an in-ref counter; the connection flips to `stale` only after `FAIL_THRESHOLD` (currently 2) consecutive failures, so a single transient blip doesn't flicker the pill.
- SIRAM trigger POSTs `/api/siram` immediately on click and shows an optimistic `queued` state for 3s before resetting.

### UI

- Mobile-first Tailwind. Cards stack to one column under `sm`. The SIRAM button must remain reachable without scrolling on common phone widths.
- Indonesian copy is the default (`SIRAM`, `Menghubungkan…`, etc.) since the target audience is Indonesian hobbyist farmers.
- Light/dark theming uses Tailwind's class-based `dark:` variant (configured via `@custom-variant dark` in `src/app/globals.css`). The `.dark` class lives on `<html>`. Default to system preference (`prefers-color-scheme`); persist the user's manual choice in `localStorage` under the key `theme`. A blocking inline script in `src/app/layout.tsx` reads storage and sets the class before paint to avoid FOUC. `suppressHydrationWarning` on `<html>` is required because the script mutates the className after server render. When adding components, write light-mode utility classes as the default and append `dark:` variants — do not hard-code one theme.
- Inline scripts **must** go through the `InlineScript` helper (`src/components/InlineScript.tsx`). It renders `type="text/javascript"` on the server (so the browser runs it during HTML parsing) and `type="text/plain"` on the client (so React doesn't try to re-execute on hydration), with `suppressHydrationWarning`. Raw `<script>` tags in components trigger a Next.js 16 error.
- Client components that read external/DOM state (themes, persisted UI) must use a **stable initial state** that matches the server, then sync via `useEffect`. Reading from `document` in a `useState` initializer causes hydration mismatches because the value differs between SSR and client. See `useTheme` and `ThemeToggle` (`ready` flag) for the pattern.

## Verification

- `npm run build` from `dashboard/` — must compile clean.
- `npm run dev` → open `http://localhost:3000`, sensor cards must update every ~2s.
- REST smoke test (with server running):
  ```bash
  curl localhost:3000/api/sensors
  curl -X POST localhost:3000/api/siram -H 'Content-Type: application/json' -d '{"source":"web"}'
  curl localhost:3000/api/siram/command      # { pending: true, queuedAt: ... }
  curl localhost:3000/api/siram/command      # { pending: false }  (consumed)
  curl -X POST localhost:3000/api/sensors/ingest \
    -H 'Content-Type: application/json' \
    -d '{"temperatureC":24.5,"humidityPct":58,"soilMoisturePct":35,"lightLux":9000,"deviceId":"x","timestamp":1718400000000}'
  ```

## Child DOX Index

No child AGENTS.md files yet. Add a child for `src/app/api/` if route handler contracts grow complex enough to warrant their own rules.

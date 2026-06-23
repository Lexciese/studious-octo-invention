# Firmware — ESP32 Sensor + Irrigation Controller + Dashboard Host

## Purpose

ESP32 firmware for the Smart Farming system. Broadcasts a WiFi hotspot (soft-AP at `192.168.4.1`), serves the Next.js dashboard directly to browsers over HTTP on port 80, reads sensors on demand, and drives a water-pump relay + the on-board LED when SIRAM is triggered. No laptop broker — the ESP32 is the dashboard host, the API server, and the I/O controller all in one.

## Ownership

**Owner**: lexciese
**Parent**: [Root AGENTS.md](../AGENTS.md)

## Local Contracts

### Topology

```
   ┌──── ESP32 (soft-AP 192.168.4.1) ──────────────────┐
   │  WiFi hotspot "SmartFarm" (open or WPA2)          │
   │                                                    │
   │  WebServer :80  ◄─────── Phone/laptop joins hotspot
   │    GET  /                → dashboard HTML          │
   │    GET  /_next/static/** → JS/CSS/fonts (LittleFS) │
   │    GET  /favicon.ico     → icon (LittleFS)         │
   │    GET  /api/sensors     → JSON                    │
   │    POST /api/siram       → JSON                    │
   │                                                    │
   │  GPIO 2  → on-board LED (mirrors relay state)      │
   │  GPIO 26 → water pump relay                        │
   └────────────────────────────────────────────────────┘
```

The dashboard is a static Next.js export bundled into LittleFS. The browser loads it from `http://192.168.4.1/` and polls same-origin `/api/*` endpoints.

### REST Contract (browser ↔ ESP32, same-origin)

Must mirror `dashboard/src/lib/types.ts`. Shared C++ structs are in `src/types.h`. Wire format:

| Method | Endpoint | Body / Response |
|--------|----------|------------------|
| `GET`  | `/api/sensors` | `{ temperatureC, humidityPct, soilMoisturePct, lightLux, deviceId, timestamp }` — sensors read on-demand per request |
| `POST` | `/api/siram`   | body: `{ source?: "web" }` → `{ ok: true, queuedAt: <millis()> }`; relay + LED latch on immediately for `SIRAM_DURATION_MS` |

No queue, no pending state — the ESP32 is the executor, not a broker.

### Static File Contract (LittleFS)

`firmware/data/` is populated at build time by `scripts/build-dashboard.sh` (runs `npm run build:esp` in `dashboard/`, copies `out/*`, strips `.br`/`.gz` precompressed files since the sync `WebServer` won't auto-serve them). `data/` is gitignored — it's a build artifact, not source. The flash sequence must run `pio run -t uploadfs` after the script; a fresh clone with empty `data/` will boot fine but serve 404s for the dashboard.

### Configuration

- `src/config.h` is **gitignored** — it holds the local hotspot password and device ID. Edit directly; do not commit.
- `src/config.example.h` is the committed template. Copy to `config.h` for first-time setup.
- `AP_USE_PASSWORD` toggles open vs WPA2-PSK. When `true`, `AP_PASSWORD` must be 8+ characters (WiFi library silently fails to start the AP otherwise).

### Pin Map

| Purpose | GPIO |
|---------|------|
| On-board LED (SIRAM status mirror) | 2 |
| SIRAM relay (water pump/solenoid) | 26 |
| Future I2C SDA / SCL | 21 / 22 |
| Future capacitive soil analog | 34 |

### Partition Layout

`partitions.csv` defines a no-OTA layout: ~2 MB app + ~2 MB LittleFS on the 4 MB esp32dev flash. If the dashboard export outgrows LittleFS, adjust here (and re-measure with `du -sh dashboard/out/`).

## Work Guidance

### Technology Stack

- ESP32 Arduino framework via PlatformIO (`espressif32` platform, `esp32dev` board).
- `bblanchon/ArduinoJson @ ^7` for JSON serialize/parse (declared in `platformio.ini`).
- Built-in `WebServer` (synchronous) on port 80, `LittleFS` for static files, `WiFi` soft-AP. All in the ESP32 Arduino core — no extra `lib_deps` needed.
- ESP32 Arduino core 3.x unified WiFi event API — use `WiFi.onEvent()` with `arduino_event_id_t` and `arduino_event_info_t`. Do not use the removed `WiFi.onSoftAPModeStationConnected` style callbacks.

### Code Layout

- `src/main.cpp` — setup + loop. `loop()` calls `handleHttpClient()` (processes at most one ready request then returns) and `siram.update()` every iteration; heartbeat every 10 s.
- `src/wifi_ap.{h,cpp}` — soft-AP setup, station-event logging.
- `src/web_server.{h,cpp}` — `WebServer` wrapper. Routes for `/`, `/_next/static/**`, `/favicon.ico`, `/api/sensors`, `/api/siram`, plus a 404 handler.
- `src/sensors.{h,cpp}` — sensor reads. Called on-demand from the `/api/sensors` handler. Default: jittered mock values. TODO comments document where real libraries (BME280, BH1750, capacitive analog) plug in.
- `src/siram.{h,cpp}` — non-blocking relay + LED control with timed release.
- `src/types.h` — structs mirroring `dashboard/src/lib/types.ts`.
- `src/json_helpers.h` — inline ArduinoJson serialize/parse helpers.

### Loop Conventions

- **No `delay()`** — use `millis()` deltas so the loop stays responsive during a 5 s SIRAM activation and so `WebServer.handleClient()` gets called frequently enough to stream large static assets.
- All serial log lines are prefixed with `[AP]`, `[HTTP]`, `[SIRAM]`, or `[MAIN]` for easy grep.

## Verification

```bash
cd firmware
./scripts/build-dashboard.sh    # build dashboard + populate data/  (requires dashboard/)
pio run                         # compile firmware (must exit 0 with [SUCCESS])
pio run -t size                 # report flash/RAM usage
pio run -t upload               # flash firmware over USB
pio run -t uploadfs             # flash LittleFS image (dashboard files)
pio device monitor -b 115200    # serial log (Ctrl+] to exit)
```

End-to-end smoke test (requires hardware): see `README.md`.

## Child DOX Index

No child AGENTS.md files yet. Add one for `src/` only if module-level rules grow beyond what fits here.

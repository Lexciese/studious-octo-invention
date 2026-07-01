# Firmware — ESP32 Sensor + Irrigation Controller + Dashboard Host

## Purpose

ESP32 firmware for the Smart Farming system. Broadcasts a WiFi hotspot (soft-AP at `192.168.4.1`), serves the Next.js dashboard directly to browsers over HTTP on port 80, reads a capacitive soil moisture sensor and PIR motion sensor on demand, auto-triggers the water pump when soil is dry, and swings an SG90 servo when motion is detected. No laptop broker — the ESP32 is the dashboard host, the API server, and the I/O controller all in one.

## Ownership

**Owner**: lexciese
**Parent**: [Root AGENTS.md](../AGENTS.md)

## Local Contracts

### Topology

```
   ESP32 (soft-AP 192.168.4.1)
   WiFi hotspot "SmartFarm" (open or WPA2)

   WebServer :80  <----- Phone/laptop joins hotspot
     GET  /                -> dashboard HTML
     GET  /_next/static/** -> JS/CSS/fonts (LittleFS)
     GET  /favicon.ico     -> icon (LittleFS)
     GET  /api/sensors     -> JSON
     POST /api/siram       -> JSON
     POST /api/ota         -> body {url} start OTA from URL
     POST /api/ota/upload  -> multipart .bin  flash OTA from upload
     GET  /api/ota/status  -> {state, progress, error?}

   GPIO 2  -> on-board LED (mirrors pump state)
   GPIO 14 -> SG90 servo (PIR-triggered)
   GPIO 26 -> water pump relay
   GPIO 27 -> HC-SR501 PIR motion sensor (digital)
   GPIO 34 -> capacitive soil moisture sensor (analog ADC)
```

The dashboard is a static Next.js export bundled into LittleFS. The browser loads it from `http://192.168.4.1/` and polls same-origin `/api/*` endpoints.

### REST Contract (browser -> ESP32, same-origin)

Must mirror `dashboard/src/lib/types.ts`. Shared C++ structs are in `src/types.h`. Wire format:

| Method | Endpoint | Body / Response |
|--------|----------|------------------|
| `GET`  | `/api/sensors` | `{ soilMoisturePct, pirActive, pumpActive, deviceId, timestamp }` — sensors read on-demand per request |
| `POST` | `/api/siram`   | body: `{ source?: "web" }` -> `{ ok: true, queuedAt: <millis()> }`; relay + LED latch on immediately for `SIRAM_DURATION_MS` |
| `POST` | `/api/ota`     | body: `{ url }` -> `{ ok, error? }` — kick off URL-based OTA download to inactive partition |
| `POST` | `/api/ota/upload` | multipart `.bin` file upload -> flashes to inactive partition directly, reboots on success |
| `GET`  | `/api/ota/status` | `{ state, progress, error? }` — poll OTA progress during URL-based download |

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
| On-board LED (pump status mirror) | 2 |
| SG90 servo (PIR-triggered scare/gate) | 14 |
| SIRAM relay (water pump) | 26 |
| HC-SR501 PIR motion sensor | 27 |
| Capacitive soil moisture sensor (ADC) | 34 |

### Partition Layout

`partitions.csv` defines a dual-OTA layout on the 4 MB esp32dev flash: ~1.5 MB per app slot (`ota_0`, `ota_1`) + ~960 KB LittleFS + `otadata`. App slots were shrunk from 1.75 MB to give LittleFS more room for the dashboard static export. The ESP32 bootloader uses the `otadata` partition to choose which slot to boot from; when `Update.end()` succeeds, it sets the new slot active and reboots. If the dashboard export outgrows 960 KB, adjust sizes here (and re-measure with `du -sh dashboard/out/`).

## Work Guidance

### Technology Stack

- ESP32 Arduino framework via PlatformIO (`espressif32` platform, `esp32dev` board).
- `bblanchon/ArduinoJson @ ^7` for JSON serialize/parse.
- `madhephaestus/ESP32Servo @ ^3` for SG90 servo PWM control.
- Built-in `WebServer` (synchronous) on port 80, `LittleFS` for static files, `WiFi` soft-AP. All in the ESP32 Arduino core.
- ESP32 Arduino core 3.x unified WiFi event API — use `WiFi.onEvent()` with `arduino_event_id_t` and `arduino_event_info_t`. Do not use the removed `WiFi.onSoftAPModeStationConnected` style callbacks.

### Code Layout

- `src/main.cpp` — setup + loop. `loop()` calls `handleHttpClient()`, `updateSiram()`, `handleOtaUpdate()`, polls PIR for servo trigger, and runs auto-pump logic every iteration; heartbeat every 10 s.
- `src/wifi_ap.{h,cpp}` — soft-AP setup, station-event logging.
- `src/web_server.{h,cpp}` — `WebServer` wrapper. Routes for `/`, `/_next/static/**`, `/favicon.ico`, `/api/sensors`, `/api/siram`, `/api/ota`, `/api/ota/upload`, `/api/ota/status`, plus a 404 handler.
- `src/sensors.{h,cpp}` — sensor reads. Called on-demand from `/api/sensors`. `readSoilMoisturePct()` maps analog ADC to 0–100%. `readPir()` returns digital HIGH/LOW. `readAllSensors()` returns the full `SensorReading` struct.
- `src/siram.{h,cpp}` — non-blocking actuator control. Pump relay + LED with timed release (web trigger or auto-pump when soil is dry). SG90 servo triggered by PIR with timed return-to-rest.
- `src/ota.{h,cpp}` — non-blocking OTA update state machine. Downloads firmware binary from a URL via HTTPClient, writes to the inactive partition via the Update API, and reboots. Driven by `handleOtaUpdate()` called from `loop()`.
- `src/types.h` — structs mirroring `dashboard/src/lib/types.ts`.
- `src/json_helpers.h` — inline ArduinoJson serialize/parse helpers.

### Loop Conventions

- **No `delay()`** — use `millis()` deltas so the loop stays responsive during pump activation, servo swing, and static asset streaming.
- PIR is polled every `loop()` iteration. The HC-SR501's internal retrigger timeout prevents rapid servo re-triggering.
- Auto-pump has a configurable cooldown (`PUMP_COOLDOWN_MS`) to prevent repeated activation when soil stays dry.
- All serial log lines are prefixed with `[AP]`, `[HTTP]`, `[SIRAM]`, `[OTA]`, or `[MAIN]` for easy grep.

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

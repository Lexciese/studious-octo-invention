# Firmware — ESP32 Sensor + Irrigation Controller

## Purpose

ESP32 firmware implementing the device side of the smart-farming REST contract. Broadcasts a WiFi hotspot (soft-AP at `192.168.4.1`) so a laptop running the Next.js dashboard can join from anywhere without an existing network. Pushes sensor readings every 5 s and polls for SIRAM irrigation commands every 1 s. Drives a water-pump relay + the on-board LED when a command arrives.

## Ownership

**Owner**: lexciese
**Parent**: [Root AGENTS.md](../AGENTS.md)

## Local Contracts

### Topology

```
   ┌──── ESP32 (soft-AP 192.168.4.1) ────┐
   │  WiFi hotspot "SmartFarm"           │
   │  POST /api/sensors/ingest  ───────►  Laptop (DHCP 192.168.4.2+)
   │  GET  /api/siram/command   ◄───────  runs Next.js dashboard:3000
   └─────────────────────────────────────┘
```

The dashboard is the state broker (see `dashboard/AGENTS.md`). The firmware is a thin HTTP client to it.

### REST Contract

Must mirror `dashboard/src/lib/types.ts`. Shared C++ structs are in `src/types.h`. Wire format:

| Method | Endpoint | Body / Response |
|--------|----------|------------------|
| `POST` | `/api/sensors/ingest` | body: `{ temperatureC, humidityPct, soilMoisturePct, lightLux, deviceId, timestamp }` → `204` |
| `GET`  | `/api/siram/command`  | `{ pending: false }` or `{ pending: true, queuedAt }` (atomic consume on read) |

When changing either side, update both `firmware/src/types.h` and `dashboard/src/lib/types.ts` together.

### Configuration

- `src/config.h` is **gitignored** — it holds the local hotspot password and dashboard host IP. Edit directly; do not commit.
- `src/config.example.h` is the committed template. Copy to `config.h` for first-time setup.
- `AP_USE_PASSWORD` toggles open vs WPA2-PSK. When `true`, `AP_PASSWORD` must be 8+ characters (WiFi library silently fails to start the AP otherwise).

### Pin Map

| Purpose | GPIO |
|---------|------|
| On-board LED (SIRAM status mirror) | 2 |
| SIRAM relay (water pump/solenoid) | 26 |
| Future I2C SDA / SCL | 21 / 22 |
| Future capacitive soil analog | 34 |

## Work Guidance

### Technology Stack

- ESP32 Arduino framework via PlatformIO (`espressif32` platform, `esp32dev` board).
- `bblanchon/ArduinoJson @ ^7` for JSON serialize/parse (declared in `platformio.ini`).
- ESP32 Arduino core 3.x unified WiFi event API — use `WiFi.onEvent()` with `arduino_event_id_t` and `arduino_event_info_t`. Do not use the removed `WiFi.onSoftAPModeStationConnected` style callbacks.

### Code Layout

- `src/main.cpp` — setup + loop. Two `millis()`-based timers (POST every 5 s, POLL every 1 s) plus `siram.update()` every iteration.
- `src/wifi_ap.{h,cpp}` — soft-AP setup, station-event logging.
- `src/dashboard_client.{h,cpp}` — `postReading` + `pollCommand` via `HTTPClient`.
- `src/sensors.{h,cpp}` — sensor reads. Default: jittered mock values. TODO comments document where real libraries (BME280, BH1750, capacitive analog) plug in.
- `src/siram.{h,cpp}` — non-blocking relay + LED control with timed release.
- `src/types.h` — structs mirroring `dashboard/src/lib/types.ts`.
- `src/json_helpers.h` — inline ArduinoJson serialize/parse helpers.

### Loop Conventions

- **No `delay()`** — use `millis()` deltas so the loop stays responsive during a 5 s SIRAM activation.
- HTTP timeouts are 5 s per call. Failed calls log and continue; they don't halt the loop.
- All serial log lines are prefixed with `[AP]`, `[HTTP]`, `[SIRAM]`, or `[MAIN]` for easy grep.

## Verification

```bash
cd firmware
pio run                 # compile (must exit 0 with [SUCCESS])
pio run -t size         # report flash/RAM usage
pio run -t upload       # flash over USB
pio device monitor -b 115200   # watch serial log
```

End-to-end smoke test (requires hardware + laptop): see `README.md`.

## Child DOX Index

No child AGENTS.md files yet. Add one for `src/` only if module-level rules grow beyond what fits here.

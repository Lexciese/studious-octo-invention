# Smart Farming — ESP32 Firmware

Firmware for the ESP32 that broadcasts its own WiFi hotspot, **serves the
dashboard directly to browsers over HTTP**, reads sensors on demand, and drives
the irrigation relay when a SIRAM command arrives. No laptop broker — the ESP32
is the dashboard host, the API server, and the I/O controller all in one.

## Topology

```
              hotspot (192.168.4.0/24)
   ┌──────── ESP32 (192.168.4.1) ──────────────────┐
   │  softAP "SmartFarm" (open or WPA2)             │
   │                                                 │
   │  WebServer :80  ◄─────── Phone/laptop joins AP  │
   │    GET  /                → dashboard HTML       │
   │    GET  /_next/static/** → JS/CSS/fonts         │
   │    GET  /favicon.ico     → icon                 │
   │    GET  /api/sensors     → JSON                 │
   │    POST /api/siram       → JSON                 │
   │                                                 │
   │  GPIO 2  → on-board LED (mirrors relay state)   │
   │  GPIO 26 → water pump relay                     │
   └─────────────────────────────────────────────────┘
```

The ESP32 broadcasts a hotspot. Your phone or laptop joins it, opens
`http://192.168.4.1/` in a browser, and gets the dashboard. The browser polls
`/api/sensors` every 2 s and POSTs `/api/siram` when you tap the button. All
same-origin, all HTTP — no mixed content, no CORS, no broker.

## Hardware

| Component | GPIO | Notes |
|-----------|------|-------|
| On-board LED | 2 | Mirrors the relay state — visible feedback that SIRAM fired |
| Relay module (water pump/solenoid) | 26 | Active-high. Relay IN → GPIO 26, VCC → 5V, GND → GND |
| Future: BME280 (temp + humidity) | 21 / 22 | I2C SDA / SCL |
| Future: capacitive soil moisture | 34 | Analog (ADC1) |
| Future: BH1750 (light) | 21 / 22 | Shared I2C |

The first iteration ships with **mock sensor values** so you can flash and see
the end-to-end data flow without any external sensors wired. See
[`src/sensors.cpp`](src/sensors.cpp) for TODO markers showing where to drop in
real sensor libraries.

## First-time setup

1. **Install PlatformIO** — `pip install platformio` or via the VSCode
   extension. Already-installed on this machine at `/usr/bin/pio`.

2. **Configure the firmware** — copy the example config and edit it:
   ```bash
   cd firmware
   cp src/config.example.h src/config.h
   ```
   Open `src/config.h` and set:
   - `AP_SSID` — hotspot name (any value)
   - `AP_USE_PASSWORD` + `AP_PASSWORD` — `false` for open, `true` + an 8+ char
     password for WPA2
   - `DEVICE_ID` — anything; shows in the dashboard UI

3. **Wire the relay and LED** — or leave them disconnected for bench testing;
   the firmware controls the pins regardless.

## Build, flash, monitor

The dashboard is bundled as a static Next.js export into the ESP32's LittleFS
partition. Flash sequence:

```bash
cd firmware

# 1. Build the dashboard and copy it into firmware/data/
./scripts/build-dashboard.sh

# 2. Flash the LittleFS image (dashboard files) over USB
pio run -t uploadfs

# 3. Flash the firmware binary over USB
pio run -t upload

# 4. Open the serial monitor (Ctrl+] to exit)
pio device monitor -b 115200
```

Compile only (no flash): `pio run`. Size check: `pio run -t size`.

> **Order matters.** A fresh clone with empty `firmware/data/` will fail
> `pio run -t uploadfs`. Always run `./scripts/build-dashboard.sh` first.

## Joining the hotspot

1. On your phone or laptop, scan for the WiFi network named after `AP_SSID`.
2. Join it (with the password if WPA2 is configured).
3. **Captive portal**: Android and iOS auto-detect hotspots and pop a
   "Sign in to network" notification — tapping it opens
   `http://192.168.4.1/` directly. Otherwise open a browser and navigate
   there yourself.

The dashboard loads, sensor cards populate within 2 s, and the SIRAM button is
ready.

## Expected serial output on boot

```
Smart Farming ESP32 firmware booting…

===========================================
[AP] SSID:     SmartFarm
[AP] Open network (no password)
[AP] IP:       192.168.4.1
===========================================

[HTTP] listening on http://192.168.4.1/
[MAIN] SIRAM duration 5000 ms

[AP] station connected (mac xx:xx:xx:xx:xx:xx, aid=1)
[MAIN] stations=1  siram=off
```

Tap **SIRAM** in the browser. Within ~100 ms the ESP32's on-board LED + relay
turn on for 5 s:

```
[SIRAM] trigger — relay + LED on for 5000 ms
[SIRAM] relay + LED off
```

## REST contract

Implemented in [`src/web_server.cpp`](src/web_server.cpp) and must match
`dashboard/src/lib/types.ts`. The endpoints:

| Method | Path | Body / Response |
|--------|------|------------------|
| `GET`  | `/api/sensors` | `{ temperatureC, humidityPct, soilMoisturePct, lightLux, deviceId, timestamp }` — sensors read on-demand per request |
| `POST` | `/api/siram`   | body: `{ source?: "web" }` → `{ ok: true, queuedAt: <uptime-ms> }`; relay + LED latch on immediately |

No queue, no pending state — the ESP32 is the executor.

## Troubleshooting

- **`pio run -t uploadfs` fails with "no such file"**: `firmware/data/` is empty.
  Run `./scripts/build-dashboard.sh` first.
- **Browser opens `192.168.4.1` but shows "dashboard not flashed"**: the
  LittleFS image wasn't uploaded. Re-run `pio run -t uploadfs`.
- **404 for `/index.html` after flash**: re-run `./scripts/build-dashboard.sh`
  and `pio run -t uploadfs` — the dashboard export changes when you edit it.
- **Laptop can't get a DHCP lease**: the ESP32 soft-AP is limited to ~4
  concurrent stations by default. Disconnect other devices.
- **Compile errors after editing `config.h`**: make sure `AP_PASSWORD` is at
  least 8 characters when `AP_USE_PASSWORD` is `true` — the WiFi library
  silently fails to start the AP otherwise.
- **Captive portal doesn't pop on Android**: some Android variants disable it
  or use a restricted mini-browser. Open Chrome/Firefox manually and navigate
  to `http://192.168.4.1/`.

# Smart Farming — ESP32 Firmware

Firmware for the ESP32 that broadcasts its own WiFi hotspot, pushes sensor
readings to the dashboard, and drives the irrigation relay when a SIRAM command
arrives.

## Topology

```
              hotspot (192.168.4.0/24)
   ┌──────── ESP32 (192.168.4.1) ────────┐
   │  softAP "SmartFarm" (open or WPA2)  │
   │  POST /api/sensors/ingest  ──────────┼───► Laptop (192.168.4.2)
   │  GET  /api/siram/command   ◄─────────┤    runs Next.js dashboard
   │  GPIO 2  → on-board LED             │    on port 3000
   │  GPIO 26 → water pump relay         │
   └──────────────────────────────────────┘
```

The ESP32 is the access point. The dashboard runs on your laptop, which joins
the hotspot. The firmware talks to the dashboard over HTTP.

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
   - `DASHBOARD_HOST` — the laptop's IP on the hotspot (see next section)
   - `DEVICE_ID` — anything; shows in the dashboard UI

3. **Find or set the laptop's IP on the hotspot**

   The ESP32 hands out DHCP IPs starting at `192.168.4.2`. Two options:

   - **Static IP (recommended)**: configure your laptop's WiFi to use a static
     IP when joined to the SmartFarm hotspot (e.g. `192.168.4.2`, gateway
     `192.168.4.1`). Then hard-code that value in `DASHBOARD_HOST`.

   - **DHCP + lookup**: power up the ESP32, join the hotspot from the laptop,
     check `ipconfig` / `ifconfig` to find the assigned IP, then put it in
     `DASHBOARD_HOST` and reflash.

4. **Make the dashboard reachable from the hotspot**

   By default `npm run dev` binds to `localhost` only. The ESP32 won't be able
   to reach it. Bind to all interfaces instead:
   ```bash
   cd dashboard
   npm run dev -- -H 0.0.0.0
   ```

5. **Wire the relay and LED** — or leave them disconnected for bench testing;
   the firmware controls the pins regardless.

## Build, flash, monitor

```bash
cd firmware

# Compile only (no flash). Downloads the esp32 toolchain on first run.
pio run

# Flash over USB
pio run -t upload

# Serial monitor (Ctrl+] to exit)
pio device monitor -b 115200

# Combined: build + flash + monitor
pio run -t upload -t monitor
```

## Expected serial output on boot

```
Smart Farming ESP32 firmware booting…

===========================================
[AP] SSID:     SmartFarm
[AP] Open network (no password)
[AP] IP:       192.168.4.1
===========================================

[MAIN] POST every 5000 ms, POLL every 1000 ms, SIRAM 5000 ms
[MAIN] dashboard target: http://192.168.4.2:3000

[AP] station connected (mac xx:xx:xx:xx:xx:xx, aid=1)
[MAIN] POST  t=26.03°C  h=60.4%  soil=44.8%  lux=12350
[MAIN] stations=1  siram=off
```

Click **SIRAM** in the dashboard (open `http://192.168.4.2:3000` in your
browser). Within ~1 second the ESP32's on-board LED + relay turn on for 5 s,
and you'll see:

```
[HTTP] pollCommand: pending (queued 145 ms ago)
[SIRAM] trigger — relay + LED on for 5000 ms
[SIRAM] relay + LED off
```

## REST contract

Implemented in [`src/dashboard_client.cpp`](src/dashboard_client.cpp) and must
match `dashboard/src/lib/types.ts`. The endpoints:

| Method | Path | Body / Response |
|--------|------|------------------|
| `POST` | `/api/sensors/ingest` | body: `{ temperatureC, humidityPct, soilMoisturePct, lightLux, deviceId, timestamp }` → `204` |
| `GET`  | `/api/siram/command`  | returns `{ pending: false }` or `{ pending: true, queuedAt }` (atomic consume) |

## Troubleshooting

- **`[HTTP] POST failed`**: dashboard isn't running or isn't reachable.
  Verify `npm run dev -- -H 0.0.0.0` is running on the laptop and that
  `DASHBOARD_HOST` in `config.h` matches the laptop's IP on the hotspot.
- **Laptop can't get a DHCP lease**: the ESP32 soft-AP is limited to ~4
  concurrent stations by default. Disconnect other devices.
- **Compile errors after editing config.h**: make sure `AP_PASSWORD` is at
  least 8 characters when `AP_USE_PASSWORD` is `true` — the WiFi library
  silently fails to start the AP otherwise.
- **LED + relay never fire when SIRAM is clicked**: confirm the dashboard's
  browser is polling `/api/siram` and that the firmware's `/api/siram/command`
  GET requests are returning `{pending: true, ...}` (check the dashboard's
  server log).

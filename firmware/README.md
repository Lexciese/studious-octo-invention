# Smart Farming — ESP32 Firmware

ESP32 firmware that broadcasts a WiFi hotspot, serves a web dashboard, reads a soil moisture sensor and PIR motion sensor, drives a water pump relay and an SG90 servo, and sounds a buzzer on motion detection. No laptop broker needed.

## Pinout

| GPIO | Device |
|------|--------|
| 2    | On-board LED (mirrors pump state) |
| 15   | Capacitive soil moisture sensor (analog ADC2) |
| 16   | SG90 servo (PWM) |
| 18   | HC-SR501 PIR motion sensor (digital) |
| 21   | Active buzzer (sounds on PIR) |
| 25   | Water pump relay (active-high) |

## Dependencies

- [PlatformIO](https://platformio.org/) (`pip install platformio`)
- `bblanchon/ArduinoJson @ ^7`
- `madhephaestus/ESP32Servo @ ^3`

## First-time setup

```bash
cd firmware
cp src/config.example.h src/config.h
```

Edit `src/config.h` to set your hotspot name, password, and device ID.

## Build & flash

```bash
cd firmware

# 1. Build the dashboard static export and copy it into data/
./scripts/build-dashboard.sh

# 2. Flash firmware binary (carries the partition table)
pio run -t upload

# 3. Flash the LittleFS image (dashboard HTML/JS/CSS)
pio run -t uploadfs
```

The **partition table** is defined in `partitions.csv`: a single factory app
(~2 MB) + LittleFS data (~2 MB). No OTA.

## What it does

- Broadcasts a WiFi hotspot (`SmartFarm` by default) at `192.168.4.1`
- Serves the dashboard on `http://192.168.4.1/`
- Polls `/api/sensors` every 2 s — returns `{soilMoisturePct, pirActive, pumpActive, deviceId, timestamp}`
- `POST /api/siram` triggers the pump relay manually
- **Auto-pump**: when soil moisture falls below 30%, the relay fires for 5 s
  (with a 60 s cooldown)
- **PIR → servo + buzzer**: when motion is detected, the servo swings to 90°
  and the buzzer sounds for 3 s, then returns to rest

## Source layout

| File | Purpose |
|------|---------|
| `src/firmware.cpp` | Entire firmware in one file — WiFi AP, sensors, pump/servo/buzzer, web server, main loop |
| `src/config.h` | Gitignored — your local credentials and pinout |
| `src/config.example.h` | Committed template — copy to `config.h` |
| `partitions.csv` | Flash layout: factory app + LittleFS |
| `scripts/build-dashboard.sh` | Builds the Next.js dashboard and populates `data/` |
| `data/` | Build artifact — dashboard static files for LittleFS |

## Joining the hotspot

1. Scan for the WiFi network (`SmartFarm` by default).
2. Join it.
3. Open `http://192.168.4.1/` in a browser.

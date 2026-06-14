#include <Arduino.h>

#include "config.h"
#include "dashboard_client.h"
#include "sensors.h"
#include "siram.h"
#include "types.h"
#include "wifi_ap.h"

namespace {

uint32_t lastPostMs = 0;
uint32_t lastPollMs = 0;
uint32_t lastHeartbeatMs = 0;

void doPost() {
  SensorReading r = readAllSensors();
  Serial.printf("[MAIN] POST  t=%.2f°C  h=%.1f%%  soil=%.1f%%  lux=%d\n",
                r.temperatureC, r.humidityPct, r.soilMoisturePct, r.lightLux);
  if (!postReading(r)) {
    Serial.println("[MAIN] POST failed (is the dashboard running and reachable?)");
  }
}

void doPoll() {
  SiramCommand cmd{};
  if (pollCommand(cmd)) {
    triggerSiram();
  }
}

}  // namespace

void setup() {
  Serial.begin(115200);
  delay(200);
  Serial.println();
  Serial.println("Smart Farming ESP32 firmware booting…");

  startAccessPoint();
  beginSiram();

  Serial.printf("[MAIN] POST every %lu ms, POLL every %lu ms, SIRAM %lu ms\n",
                (unsigned long)POST_INTERVAL_MS,
                (unsigned long)POLL_INTERVAL_MS,
                (unsigned long)SIRAM_DURATION_MS);
  Serial.printf("[MAIN] dashboard target: http://%s:%d\n",
                DASHBOARD_HOST, DASHBOARD_PORT);
  Serial.println();
}

void loop() {
  uint32_t now = millis();

  if (now - lastPostMs >= POST_INTERVAL_MS) {
    lastPostMs = now;
    doPost();
  }

  if (now - lastPollMs >= POLL_INTERVAL_MS) {
    lastPollMs = now;
    doPoll();
  }

  updateSiram();

  // Heartbeat every 10 s — useful when watching the serial monitor.
  if (now - lastHeartbeatMs >= 10000UL) {
    lastHeartbeatMs = now;
    Serial.printf("[MAIN] stations=%u  siram=%s\n",
                  stationCount(), siramActive() ? "on" : "off");
  }
}

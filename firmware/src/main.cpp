#include <Arduino.h>
#include <LittleFS.h>

#include "config.h"
#include "sensors.h"
#include "siram.h"
#include "types.h"
#include "web_server.h"
#include "wifi_ap.h"

namespace {

uint32_t lastHeartbeatMs = 0;

}  // namespace

void setup() {
  Serial.begin(115200);
  delay(200);
  Serial.println();
  Serial.println("Smart Farming ESP32 firmware booting…");

  startAccessPoint();
  beginSiram();

  if (!LittleFS.begin(true)) {
    Serial.println("[FS] LittleFS mount failed — dashboard will not be served");
  }

  beginWebServer();

  Serial.printf("[MAIN] SIRAM duration %lu ms\n",
                (unsigned long)SIRAM_DURATION_MS);
  Serial.println();
}

void loop() {
  handleHttpClient();
  updateSiram();

  uint32_t now = millis();
  if (now - lastHeartbeatMs >= 10000UL) {
    lastHeartbeatMs = now;
    Serial.printf("[MAIN] stations=%u  siram=%s\n",
                  stationCount(), siramActive() ? "on" : "off");
  }
}

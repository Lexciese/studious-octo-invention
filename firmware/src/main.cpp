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

  Serial.printf("[MAIN] pump duration %lu ms  servo GPIO %d  PIR GPIO %d\n",
                (unsigned long)SIRAM_DURATION_MS, PIN_SERVO, PIN_PIR);
  Serial.println();
}

void loop() {
  handleHttpClient();
  updateSiram();

  // ponytail: poll PIR every loop iteration (sub-ms). No debounce needed —
  // the HC-SR501 retriggers internally and holds HIGH for its own timeout.
  if (readPir() && !servoActive()) {
    triggerServo();
  }

  // Auto-pump based on soil moisture threshold.
  updateAutoPump(readSoilMoisturePct());

  uint32_t now = millis();
  if (now - lastHeartbeatMs >= 10000UL) {
    lastHeartbeatMs = now;
    Serial.printf("[MAIN] stations=%u  pump=%s  servo=%s\n",
                  stationCount(),
                  siramActive() ? "on" : "off",
                  servoActive() ? "active" : "rest");
  }
}

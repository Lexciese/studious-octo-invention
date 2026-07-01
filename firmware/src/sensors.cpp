#include "sensors.h"

#include <Arduino.h>
#include <esp_timer.h>

#include "config.h"
#include "siram.h"

namespace {

int64_t epochMs() {
  return (int64_t)(esp_timer_get_time() / 1000LL);
}

}  // namespace

float readSoilMoisturePct() {
  int raw = analogRead(PIN_SOIL_ANALOG);
  // ponytail: linear map, ADC inverse (dry=high, wet=low).
  // Ceiling: per-probe calibration may need a lookup table for better accuracy.
  float pct = map(raw, SOIL_DRY_ADC, SOIL_WET_ADC, 0, 100);
  return constrain(pct, 0.0f, 100.0f);
}

bool readPir() {
  return digitalRead(PIN_PIR) == HIGH;
}

SensorReading readAllSensors() {
  return SensorReading{
    .soilMoisturePct  = readSoilMoisturePct(),
    .pirActive        = readPir(),
    .pumpActive       = siramActive(),
    .deviceId         = DEVICE_ID,
    .timestamp        = epochMs(),
  };
}

#include "sensors.h"

#include <esp_timer.h>

#include "config.h"

namespace {

float jitter(float base, float step) {
  float delta = ((float)rand() / RAND_MAX - 0.5f) * 2.0f * step;
  return base + delta;
}

int jitterInt(int base, int step) {
  int delta = (int)(((float)rand() / RAND_MAX - 0.5f) * 2.0f * (float)step);
  return base + delta;
}

int64_t epochMs() {
  return (int64_t)(esp_timer_get_time() / 1000LL);
}

}  // namespace

float readTemperatureC() {
  // TODO: replace with a real sensor, e.g. Adafruit BME280:
  //   return bme.readTemperature();
  return jitter(MOCK_TEMP_C, 0.4f);
}

float readHumidityPct() {
  // TODO: replace with a real sensor, e.g. Adafruit BME280:
  //   return bme.readHumidity();
  return jitter(MOCK_HUMIDITY_PCT, 1.5f);
}

float readSoilMoisturePct() {
  // TODO: replace with a capacitive soil moisture sensor on PIN_SOIL_ANALOG:
  //   int raw = analogRead(PIN_SOIL_ANALOG);            // 0..4095
  //   float pct = map(raw, 4095, 0, 0, 100);             // dry→wet (tune per probe)
  //   return constrain(pct, 0.0f, 100.0f);
  return jitter(MOCK_SOIL_PCT, 1.2f);
}

int readLightLux() {
  // TODO: replace with a BH1750 light sensor over I2C:
  //   return (int)lightMeter.readLightLevel();
  return jitterInt(MOCK_LIGHT_LUX, 800);
}

SensorReading readAllSensors() {
  return SensorReading{
    .temperatureC     = readTemperatureC(),
    .humidityPct      = readHumidityPct(),
    .soilMoisturePct  = readSoilMoisturePct(),
    .lightLux         = readLightLux(),
    .deviceId         = DEVICE_ID,
    .timestamp        = epochMs(),
  };
}

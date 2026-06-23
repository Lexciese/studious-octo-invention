#ifndef JSON_HELPERS_H
#define JSON_HELPERS_H

#include <ArduinoJson.h>

#include "types.h"

// Serialize a SensorReading into the JSON shape returned by GET /api/sensors.
inline String serializeReading(const SensorReading& r) {
  JsonDocument doc;
  doc["temperatureC"]     = r.temperatureC;
  doc["humidityPct"]      = r.humidityPct;
  doc["soilMoisturePct"]  = r.soilMoisturePct;
  doc["lightLux"]         = r.lightLux;
  doc["deviceId"]         = r.deviceId;
  doc["timestamp"]        = r.timestamp;
  String out;
  serializeJson(doc, out);
  return out;
}

#endif // JSON_HELPERS_H

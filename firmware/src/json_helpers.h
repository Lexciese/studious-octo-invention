#ifndef JSON_HELPERS_H
#define JSON_HELPERS_H

#include <ArduinoJson.h>

#include "types.h"

// Serialize a SensorReading into the JSON shape the dashboard's
// `/api/sensors/ingest` endpoint expects.
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

// Parse the JSON returned by `/api/siram/command` into out.
// Returns true if the parse succeeded.
inline bool parseSiramCommand(const String& body, SiramCommand& out) {
  JsonDocument doc;
  if (deserializeJson(doc, body) != DeserializationError::Ok) {
    return false;
  }
  out.pending  = doc["pending"] | false;
  out.queuedAt = doc["queuedAt"] | (int64_t)0;
  return true;
}

#endif // JSON_HELPERS_H

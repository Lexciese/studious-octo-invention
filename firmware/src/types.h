#ifndef TYPES_H
#define TYPES_H

#include <stdint.h>

// Mirror of `dashboard/src/lib/types.ts` — keep in sync when changing the API
// contract between ESP32 and dashboard.

struct SensorReading {
  float       temperatureC;
  float       humidityPct;
  float       soilMoisturePct;
  int         lightLux;
  const char* deviceId;
  int64_t     timestamp;  // uptime milliseconds (no RTC); not used for staleness
};

#endif // TYPES_H

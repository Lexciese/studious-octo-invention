#ifndef TYPES_H
#define TYPES_H

#include <stdint.h>

// Mirror of `dashboard/src/lib/types.ts` — keep in sync when changing the API
// contract between ESP32 and dashboard.

struct SensorReading {
  float       soilMoisturePct;  // 0 = dry, 100 = saturated
  bool        pirActive;        // true when PIR motion sensor detects movement
  bool        pumpActive;       // true while pump relay is on
  const char* deviceId;
  int64_t     timestamp;        // uptime milliseconds (no RTC)
};

#endif // TYPES_H

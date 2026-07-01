#ifndef SENSORS_H
#define SENSORS_H

#include "types.h"

// Read capacitive soil moisture sensor on PIN_SOIL_ANALOG.
// Returns 0 (dry) to 100 (saturated).
float readSoilMoisturePct();

// Read PIR motion sensor on PIN_PIR.
// Returns true when motion is detected (HIGH).
bool readPir();

// Fills a SensorReading with current values + the device id + timestamp.
SensorReading readAllSensors();

#endif // SENSORS_H

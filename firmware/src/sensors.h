#ifndef SENSORS_H
#define SENSORS_H

#include "types.h"

// Read each sensor, returning a value in the unit shown.
// Default implementations return plausible jittered mock values; see sensors.cpp
// for how to swap in real sensor libraries.
float readTemperatureC();    // °C
float readHumidityPct();     // % relative humidity
float readSoilMoisturePct(); // % volumetric water content (0 = dry, 100 = saturated)
int   readLightLux();        // lux

// Fills a SensorReading with current values + the device id + timestamp.
SensorReading readAllSensors();

#endif // SENSORS_H

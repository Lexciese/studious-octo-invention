#ifndef WIFI_AP_H
#define WIFI_AP_H

#include <Arduino.h>
#include <IPAddress.h>

// Brings up the ESP32 as a WiFi access point. Blocks until the soft-AP has an
// IP assigned (typically <100 ms). Returns the AP IP (192.168.4.1 by default).
IPAddress startAccessPoint();

// Number of stations (laptop/phone) currently joined to the AP.
uint8_t stationCount();

#endif // WIFI_AP_H

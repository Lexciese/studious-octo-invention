#ifndef WEB_SERVER_H
#define WEB_SERVER_H

#include <Arduino.h>

// Start the HTTP server on port 80. Call once in setup() after LittleFS is
// mounted. Routes:
//   GET  /                  → dashboard index.html (from LittleFS)
//   GET  /_next/static/**   → JS/CSS/font chunks (from LittleFS, long-cached)
//   GET  /favicon.ico       → icon (from LittleFS)
//   GET  /api/sensors       → current sensor reading as JSON
//   POST /api/siram         → trigger relay+LED, return {ok, queuedAt}
void beginWebServer();

// Pumps one pending HTTP request. Non-blocking when nothing is waiting.
// Call every loop iteration so large static assets stream smoothly.
void handleHttpClient();

#endif  // WEB_SERVER_H

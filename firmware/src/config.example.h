// Copy this file to `src/config.h` and edit the values to match your setup.
// `config.h` is gitignored — your local credentials stay local.

#ifndef CONFIG_H
#define CONFIG_H

// ─── WiFi Access Point ───────────────────────────────────────────────────────
// The ESP32 broadcasts this network. Clients (laptop/phone) join it to reach
// the dashboard at http://192.168.4.1/.
#define AP_SSID             "SmartFarm"
// Set AP_USE_PASSWORD to true to enable WPA2-PSK (password must be 8+ chars).
// Set to false for an open network.
#define AP_USE_PASSWORD     true
#define AP_PASSWORD         "tani1234"

// Surfaced in the dashboard UI as the device identifier.
#define DEVICE_ID           "smart-farm-01"

// ─── Pin Map ─────────────────────────────────────────────────────────────────
#define PIN_LED             2   // On-board LED on most ESP32 dev boards
#define PIN_RELAY           26  // Active-high relay module for the water pump

// Reserved for future sensor wiring — not used in the current mock build.
#define PIN_I2C_SDA         21
#define PIN_I2C_SCL         22
#define PIN_SOIL_ANALOG     34  // ADC1 input-only pin

// ─── Timing (milliseconds) ───────────────────────────────────────────────────
#define SIRAM_DURATION_MS   5000UL   // How long the valve stays open per command

// ─── Mock Sensor Baselines (used until real sensors are wired) ───────────────
// Replace these by editing sensors.{h,cpp} to call real sensor libraries.
#define MOCK_TEMP_C         26.0f
#define MOCK_HUMIDITY_PCT   60.0f
#define MOCK_SOIL_PCT       45.0f
#define MOCK_LIGHT_LUX      12000

#endif // CONFIG_H

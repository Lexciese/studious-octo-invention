// Copy this file to `src/config.h` and edit the values to match your setup.
// `config.h` is gitignored — your local credentials stay local.

#ifndef CONFIG_H
#define CONFIG_H

// ─── WiFi Access Point ───────────────────────────────────────────────────────
#define AP_SSID             "SmartFarm"
#define AP_USE_PASSWORD     true
#define AP_PASSWORD         "tani1234"

#define DEVICE_ID           "smart-farm-01"

// ─── Pin Map ─────────────────────────────────────────────────────────────────
#define PIN_LED             2       // On-board LED (mirrors pump state)
#define PIN_RELAY           26      // Active-high relay for water pump
#define PIN_PIR             27      // HC-SR501 PIR motion sensor (digital)
#define PIN_SERVO           14      // SG90 servo signal (PWM)
#define PIN_SOIL_ANALOG     34      // Capacitive soil moisture sensor (ADC1)

// ─── Soil Moisture ───────────────────────────────────────────────────────────
// ADC raw range for a typical capacitive probe: dry ≈ 2800, wet ≈ 1400.
// Tune these per probe by reading serial output at known moisture levels.
#define SOIL_DRY_ADC        2800
#define SOIL_WET_ADC        1400
// Auto-pump triggers when soil moisture falls below this percentage.
#define SOIL_MOISTURE_THRESHOLD_PCT  30

// ─── Servo ───────────────────────────────────────────────────────────────────
#define SERVO_REST_DEG      0       // Degrees when idle
#define SERVO_ACTIVE_DEG    90      // Degrees when PIR triggers
#define SERVO_DURATION_MS   3000UL  // How long the servo stays at active position

// ─── Timing (milliseconds) ───────────────────────────────────────────────────
#define SIRAM_DURATION_MS   5000UL  // Pump run duration per trigger
#define PUMP_COOLDOWN_MS    60000UL // Minimum interval between auto-pump cycles

#endif // CONFIG_H

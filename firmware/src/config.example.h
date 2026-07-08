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
#define PIN_BUZZER          21      // Active buzzer (sounds on PIR)
#define PIN_RELAY           25      // Active-high relay for water pump
#define PIN_PIR             34      // HC-SR501 PIR motion sensor (digital)
#define PIN_SERVO           27      // SG90 servo signal (PWM)
#define PIN_SOIL_ANALOG     15      // Capacitive soil moisture

// ─── Soil Moisture ───────────────────────────────────────────────────────────
#define SOIL_DRY_ADC        2800
#define SOIL_WET_ADC        1400
#define SOIL_MOISTURE_THRESHOLD_PCT  30

// ─── Servo / Buzzer ──────────────────────────────────────────────────────────
#define SERVO_REST_DEG      0
#define SERVO_ACTIVE_DEG    90
#define SERVO_DURATION_MS   3000UL  // Servo + buzzer hold time on PIR trigger

// ─── Timing (milliseconds) ───────────────────────────────────────────────────
#define SIRAM_DURATION_MS   5000UL
#define PUMP_COOLDOWN_MS    60000UL

#endif // CONFIG_H
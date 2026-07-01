#include "siram.h"

#include <ESP32Servo.h>

#include "config.h"

namespace {

Servo servo;

bool pumpOn   = false;
bool servoOn  = false;
uint32_t pumpStartMs  = 0;
uint32_t servoStartMs = 0;
uint32_t lastPumpEndMs = 0;  // ponytail: simple cooldown, no RTC needed

void pumpOutputsOn() {
  digitalWrite(PIN_RELAY, HIGH);
  digitalWrite(PIN_LED, HIGH);
}

void pumpOutputsOff() {
  digitalWrite(PIN_RELAY, LOW);
  digitalWrite(PIN_LED, LOW);
}

}  // namespace

// ─── Setup ───────────────────────────────────────────────────────────────────

void beginSiram() {
  pinMode(PIN_RELAY, OUTPUT);
  pinMode(PIN_LED, OUTPUT);
  pinMode(PIN_PIR, INPUT);
  pumpOutputsOff();

  servo.attach(PIN_SERVO);
  servo.write(SERVO_REST_DEG);

  Serial.printf("[SIRAM] pump relay on GPIO %d, servo on GPIO %d\n",
                PIN_RELAY, PIN_SERVO);
}

// ─── Pump ────────────────────────────────────────────────────────────────────

void triggerSiram() {
  pumpOn = true;
  pumpStartMs = millis();
  pumpOutputsOn();
  Serial.printf("[SIRAM] pump on for %lu ms\n",
                (unsigned long)SIRAM_DURATION_MS);
}

bool siramActive() {
  return pumpOn;
}

// ─── Servo ───────────────────────────────────────────────────────────────────

void triggerServo() {
  servoOn = true;
  servoStartMs = millis();
  servo.write(SERVO_ACTIVE_DEG);
  Serial.printf("[SIRAM] servo → %d° for %lu ms\n",
                SERVO_ACTIVE_DEG, (unsigned long)SERVO_DURATION_MS);
}

bool servoActive() {
  return servoOn;
}

// ─── Update ──────────────────────────────────────────────────────────────────

void updateSiram() {
  uint32_t now = millis();

  if (pumpOn && (now - pumpStartMs >= SIRAM_DURATION_MS)) {
    pumpOutputsOff();
    pumpOn = false;
    lastPumpEndMs = now;
    Serial.println("[SIRAM] pump off");
  }

  if (servoOn && (now - servoStartMs >= SERVO_DURATION_MS)) {
    servo.write(SERVO_REST_DEG);
    servoOn = false;
    Serial.println("[SIRAM] servo → rest");
  }
}

// ─── Auto-pump ───────────────────────────────────────────────────────────────

void updateAutoPump(float soilMoisturePct) {
  if (pumpOn) return;  // already running, don't stack

  uint32_t now = millis();
  // ponytail: millis() wraps every ~49 days. The subtraction handles it
  // correctly (unsigned wraparound is well-defined in C++).
  if (now - lastPumpEndMs < PUMP_COOLDOWN_MS) return;

  if (soilMoisturePct < SOIL_MOISTURE_THRESHOLD_PCT) {
    Serial.printf("[SIRAM] auto-pump: soil %.1f%% < threshold %d%%\n",
                  soilMoisturePct, SOIL_MOISTURE_THRESHOLD_PCT);
    triggerSiram();
  }
}

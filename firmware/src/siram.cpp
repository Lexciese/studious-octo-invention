#include "siram.h"

#include "config.h"

namespace {

bool active = false;
uint32_t startMs = 0;

void outputsOn() {
  digitalWrite(PIN_RELAY, HIGH);
  digitalWrite(PIN_LED, HIGH);
}

void outputsOff() {
  digitalWrite(PIN_RELAY, LOW);
  digitalWrite(PIN_LED, LOW);
}

}  // namespace

void beginSiram() {
  pinMode(PIN_RELAY, OUTPUT);
  pinMode(PIN_LED, OUTPUT);
  outputsOff();
}

void triggerSiram() {
  if (active) {
    // Re-triggered while already running — extend the timer.
    startMs = millis();
    return;
  }
  active = true;
  startMs = millis();
  outputsOn();
  Serial.printf("[SIRAM] trigger — relay + LED on for %lu ms\n",
                (unsigned long)SIRAM_DURATION_MS);
}

void updateSiram() {
  if (!active) return;
  if (millis() - startMs >= SIRAM_DURATION_MS) {
    outputsOff();
    active = false;
    Serial.println("[SIRAM] relay + LED off");
  }
}

bool siramActive() {
  return active;
}

#ifndef SIRAM_H
#define SIRAM_H

#include <Arduino.h>

// ─── Setup ───────────────────────────────────────────────────────────────────
// Set pin modes for all outputs. Call once in setup().
void beginSiram();

// ─── Pump (relay + LED) ──────────────────────────────────────────────────────
// Latch the pump relay + LED on for SIRAM_DURATION_MS. Non-blocking.
// Safe to call while already running — extends the timer.
void triggerSiram();

// True while the pump relay is active.
bool siramActive();

// ─── Servo (SG90, PIR-triggered) ─────────────────────────────────────────────
// Swing servo to SERVO_ACTIVE_DEG for SERVO_DURATION_MS, then return to rest.
// Non-blocking. Safe to call while already active — extends the timer.
void triggerServo();

// True while the servo is at active position.
bool servoActive();

// ─── Update ──────────────────────────────────────────────────────────────────
// Call every loop iteration. Turns off pump/servo when their timers elapse.
void updateSiram();

// ─── Auto-pump ───────────────────────────────────────────────────────────────
// Call every loop iteration. Triggers pump when soil moisture is below
// threshold and the cooldown period has elapsed.
void updateAutoPump(float soilMoisturePct);

#endif // SIRAM_H

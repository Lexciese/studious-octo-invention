#ifndef SIRAM_H
#define SIRAM_H

#include <Arduino.h>

// Set pin modes for the relay and on-board LED. Call once in setup().
void beginSiram();

// Latch the relay + LED on for SIRAM_DURATION_MS. Non-blocking — call
// updateSiram() every loop iteration to turn them off when the timer elapses.
void triggerSiram();

// Call every loop iteration. Turns the relay + LED off when SIRAM_DURATION_MS
// has elapsed since triggerSiram().
void updateSiram();

// True while the relay + LED are on.
bool siramActive();

#endif // SIRAM_H

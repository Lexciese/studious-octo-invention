#include <Arduino.h>
#include <LittleFS.h>
#include <WiFi.h>
#include <WebServer.h>
#include <ArduinoJson.h>
#include <ESP32Servo.h>
#include <esp_timer.h>

#include "config.h"

// ──────────── Types & state ────────────

struct SensorReading {
  float       soilMoisturePct;
  bool        pirActive;
  bool        pumpActive;
  const char* deviceId;
  int64_t     timestamp;
};

static Servo servo;
static bool  pumpOn      = false;
static bool  pumpManual  = false;
static uint32_t pumpStartMs = 0, lastPumpEndMs = 0;
static int svAngle = 45;
static int svDir   = 1;

// ──────────── WiFi AP ────────────

static void onWifiEvent(arduino_event_id_t e, arduino_event_info_t i) {
  if (e == ARDUINO_EVENT_WIFI_AP_STACONNECTED)
    Serial.printf("[AP] station connected (aid=%d)\n", i.wifi_ap_staconnected.aid);
  if (e == ARDUINO_EVENT_WIFI_AP_STADISCONNECTED)
    Serial.printf("[AP] station disconnected (aid=%d)\n", i.wifi_ap_stadisconnected.aid);
}

static void startAP() {
  WiFi.mode(WIFI_AP);
  WiFi.onEvent(onWifiEvent);
#if AP_USE_PASSWORD
  bool ok = WiFi.softAP(AP_SSID, AP_PASSWORD);
#else
  bool ok = WiFi.softAP(AP_SSID);
#endif
  if (!ok) { Serial.println("[AP] failed"); return; }
  Serial.printf("[AP] SSID=%s IP=%s\n", AP_SSID, WiFi.softAPIP().toString().c_str());
}

static uint8_t stationCount() { return WiFi.softAPgetStationNum(); }

// ──────────── Sensors ────────────

static float readSoilMoisturePct() {
  int raw = digitalRead(PIN_SOIL_ANALOG);
  float pct = map(raw, 0, 1, 100, 0);
  pct = constrain(pct, 0.0f, 100.0f);
  Serial.printf("[SOIL] raw=%d pct=%.0f%%\n", raw, pct);
  // Serial.printf("[SOIL] raw=%d \n", raw);
  return pct;
}

static bool readPir() {
  bool pir = digitalRead(PIN_PIR) == HIGH;
  Serial.printf("[PIR] %s\n", pir ? "HIGH" : "LOW");
  return pir;
}

static SensorReading readAllSensors() {
  return {readSoilMoisturePct(), readPir(), pumpOn,
          DEVICE_ID, (int64_t)(esp_timer_get_time() / 1000LL)};
}

// ──────────── Actuators (pump + servo + buzzer) ────────────

static void initActuators() {
  pinMode(PIN_RELAY, OUTPUT); pinMode(PIN_LED, OUTPUT);
  digitalWrite(PIN_RELAY, LOW); digitalWrite(PIN_LED, LOW);
  pinMode(PIN_BUZZER, OUTPUT); digitalWrite(PIN_BUZZER, LOW);
  servo.attach(PIN_SERVO); servo.write(SERVO_REST_DEG);
  pinMode(PIN_PIR, INPUT);
  pinMode(PIN_SOIL_ANALOG, INPUT);
}

static void releasePump() {
  digitalWrite(PIN_RELAY, LOW);
  digitalWrite(PIN_LED, LOW);
  pumpOn = false;
}

static void updateActuators() {
  uint32_t now = millis();
  if (pumpOn && now - pumpStartMs >= SIRAM_DURATION_MS) {
    releasePump();
    pumpManual = false;
    lastPumpEndMs = now;
    Serial.println("[PUMP] off");
  }
}

// Priority-based pump control:
//   1. Manual (API) — sets pumpManual, overrides auto
//   2. Soil (auto) — runs only when pumpManual is false
static void activatePump(float pct) {
  if (pumpManual) return;  // manual takes priority
  if (pumpOn) return;
  uint32_t now = millis();
  if (now - lastPumpEndMs < PUMP_COOLDOWN_MS) return;
  if (pct >= SOIL_MOISTURE_THRESHOLD_PCT) return;
  // if (pct >= 1) return; // KERING 

  pumpOn = true;
  pumpStartMs = millis();
  digitalWrite(PIN_RELAY, HIGH);
  digitalWrite(PIN_LED, HIGH);
  Serial.printf("[PUMP] soil=%.0f%% on %lu ms\n", pct, (unsigned long)SIRAM_DURATION_MS);
}

// ──────────── Web server ────────────

static WebServer server(80);

static String contentType(const String& p) {
  if (p.endsWith(".html")) return "text/html; charset=utf-8";
  if (p.endsWith(".css"))  return "text/css; charset=utf-8";
  if (p.endsWith(".js"))   return "application/javascript; charset=utf-8";
  if (p.endsWith(".svg"))  return "image/svg+xml";
  if (p.endsWith(".ico"))  return "image/x-icon";
  if (p.endsWith(".json")) return "application/json; charset=utf-8";
  if (p.endsWith(".txt"))  return "text/plain; charset=utf-8";
  return "application/octet-stream";
}

static void handleIndex() {
  File f = LittleFS.open("/index.html", "r");
  if (!f) { server.send(200, "text/html; charset=utf-8", "<h1>Smart Farming</h1><p>Unggah dasbor: pio run -t uploadfs</p>"); return; }
  server.streamFile(f, "text/html; charset=utf-8"); f.close();
}

static void handleSensors() {
  auto r = readAllSensors();
  JsonDocument d;
  d["soilMoisturePct"] = r.soilMoisturePct;
  d["pirActive"]       = r.pirActive;
  d["pumpActive"]      = r.pumpActive;
  d["deviceId"]        = r.deviceId;
  d["timestamp"]       = r.timestamp;
  String out; serializeJson(d, out);
  server.sendHeader("Cache-Control", "no-store");
  server.send(200, "application/json; charset=utf-8", out);
}

static void handleSiram() {
  // Manual trigger — sets pumpManual flag so auto won't override
  pumpManual = true;
  pumpOn = true;
  pumpStartMs = millis();
  digitalWrite(PIN_RELAY, HIGH);
  digitalWrite(PIN_LED, HIGH);
  Serial.printf("[PUMP] api on %lu ms\n", (unsigned long)SIRAM_DURATION_MS);

  JsonDocument d;
  d["ok"] = true;
  d["on"] = true;
  d["queuedAt"] = (int64_t)millis();
  String out; serializeJson(d, out);
  server.send(200, "application/json; charset=utf-8", out);
}

static void handleNotFound() {
  String path = server.uri();
  if (path == "/") { handleIndex(); return; }
  if (LittleFS.exists(path)) {
    File f = LittleFS.open(path, "r");
    server.streamFile(f, contentType(path)); f.close();
    return;
  }
  server.send(404, "text/plain", "Not found");
}

static void initWebServer() {
  server.on("/", HTTP_GET, handleIndex);
  server.on("/api/sensors", HTTP_GET, handleSensors);
  server.on("/api/siram", HTTP_POST, handleSiram);
  server.serveStatic("/_next/static/", LittleFS, "/_next/static/", "max-age=31536000, immutable");
  server.onNotFound(handleNotFound);
  server.begin();
  Serial.println("[HTTP] http://192.168.4.1/");
}

// ──────────── Main ────────────

void setup() {
  Serial.begin(115200); delay(200); Serial.println("\nSmart Farming booting…");
  initActuators();
  startAP();
  if (!LittleFS.begin(true)) Serial.println("[FS] LittleFS mount failed");
  initWebServer();
  Serial.printf("[MAIN] pump=GPIO%d servo=GPIO%d PIR=GPIO%d buzzer=GPIO%d soil=GPIO%d\n",
                PIN_RELAY, PIN_SERVO, PIN_PIR, PIN_BUZZER, PIN_SOIL_ANALOG);
}

static uint32_t lastHb = 0;

static void sweepServo() {
  servo.write(svAngle);
  svAngle += svDir;
  if (svAngle >= 90) svDir = -1;
  if (svAngle <= 45) svDir = 1;
}

void loop() {
  server.handleClient();

  sweepServo();
  digitalWrite(PIN_BUZZER, readPir() ? HIGH : LOW);

  if (pumpOn) updateActuators();
  activatePump(readSoilMoisturePct());

  // ponytail: sweeps each loop iteration at ~20 kHz — SG90 can't move that
  // fast, so it smooths into a continuous pan. Fine for a scare/gate motion.
  delay(5);

  uint32_t now = millis();
  if (now - lastHb >= 10000) {
    lastHb = now;
    Serial.printf("[MAIN] stations=%u pump=%s\n",
                  stationCount(), pumpOn ? "on" : "off");
  }
}

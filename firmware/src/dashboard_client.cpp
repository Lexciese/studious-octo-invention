#include "dashboard_client.h"

#include <Arduino.h>
#include <HTTPClient.h>
#include <WiFiClient.h>

#include "config.h"
#include "json_helpers.h"

namespace {

String ingestUrl() {
  return String("http://") + DASHBOARD_HOST + ":" + DASHBOARD_PORT +
         "/api/sensors/ingest";
}

String commandUrl() {
  return String("http://") + DASHBOARD_HOST + ":" + DASHBOARD_PORT +
         "/api/siram/command";
}

}  // namespace

bool postReading(const SensorReading& reading) {
  WiFiClient client;
  HTTPClient http;
  http.setTimeout(HTTP_TIMEOUT_MS);
  if (!http.begin(client, ingestUrl())) {
    Serial.println("[HTTP] postReading: begin failed");
    return false;
  }
  http.addHeader("Content-Type", "application/json");

  String body = serializeReading(reading);
  int code = http.POST(body);

  bool ok = false;
  if (code > 0) {
    if (code >= 200 && code < 300) {
      ok = true;
    } else {
      Serial.printf("[HTTP] postReading: unexpected status %d\n", code);
    }
  } else {
    Serial.printf("[HTTP] postReading: error %d (%s)\n", code,
                  http.errorToString(code).c_str());
  }
  http.end();
  return ok;
}

bool pollCommand(SiramCommand& out) {
  WiFiClient client;
  HTTPClient http;
  http.setTimeout(HTTP_TIMEOUT_MS);
  http.setConnectTimeout(HTTP_TIMEOUT_MS);
  if (!http.begin(client, commandUrl())) {
    return false;
  }
  http.setReuse(false);

  int code = http.GET();
  bool consumed = false;
  if (code == 200) {
    String body = http.getString();
    if (parseSiramCommand(body, out)) {
      if (out.pending) {
        consumed = true;
        Serial.printf("[HTTP] pollCommand: pending (queued %lld ms ago)\n",
                      (int64_t)((millis() - out.queuedAt)));
      }
    } else {
      Serial.println("[HTTP] pollCommand: failed to parse body");
    }
  } else if (code > 0) {
    Serial.printf("[HTTP] pollCommand: unexpected status %d\n", code);
  } else if (code < 0) {
    // Negative codes are connection/timeout errors — these are expected
    // before the laptop joins the hotspot, so don't spam the log.
  }
  http.end();
  return consumed;
}

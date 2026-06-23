#include "web_server.h"

#include <ArduinoJson.h>
#include <LittleFS.h>
#include <WebServer.h>

#include "json_helpers.h"
#include "sensors.h"
#include "siram.h"

namespace {

WebServer server(80);

String contentType(const String& path) {
  if (path.endsWith(".html")) return "text/html; charset=utf-8";
  if (path.endsWith(".css")) return "text/css; charset=utf-8";
  if (path.endsWith(".js")) return "application/javascript; charset=utf-8";
  if (path.endsWith(".json")) return "application/json; charset=utf-8";
  if (path.endsWith(".svg")) return "image/svg+xml";
  if (path.endsWith(".ico")) return "image/x-icon";
  if (path.endsWith(".woff2")) return "font/woff2";
  if (path.endsWith(".woff")) return "font/woff";
  if (path.endsWith(".png")) return "image/png";
  if (path.endsWith(".txt")) return "text/plain; charset=utf-8";
  return "application/octet-stream";
}

void handleIndex() {
  File f = LittleFS.open("/index.html", "r");
  if (!f) {
    server.send(404, "text/plain; charset=utf-8",
                "Dashboard not flashed. Run: pio run -t uploadfs");
    return;
  }
  server.streamFile(f, "text/html; charset=utf-8");
  f.close();
}

void handleSensors() {
  SensorReading r = readAllSensors();
  server.sendHeader("Cache-Control", "no-store");
  server.send(200, "application/json; charset=utf-8", serializeReading(r));
}

void handleSiram() {
  triggerSiram();
  JsonDocument doc;
  doc["ok"] = true;
  doc["queuedAt"] = static_cast<int64_t>(millis());
  String out;
  serializeJson(doc, out);
  server.send(200, "application/json; charset=utf-8", out);
}

void handleNotFound() {
  String path = server.uri();
  if (path == "/") path = "/index.html";
  if (LittleFS.exists(path)) {
    File f = LittleFS.open(path, "r");
    server.streamFile(f, contentType(path));
    f.close();
    return;
  }
  server.send(404, "text/plain; charset=utf-8", "Not found");
}

}  // namespace

void beginWebServer() {
  server.on("/", HTTP_GET, handleIndex);
  server.on("/api/sensors", HTTP_GET, handleSensors);
  server.on("/api/siram", HTTP_POST, handleSiram);
  // Filename-hashed chunks: safe to cache forever.
  server.serveStatic("/_next/static/", LittleFS, "/_next/static/",
                     "max-age=31536000, immutable");
  server.onNotFound(handleNotFound);

  server.begin();
  Serial.println("[HTTP] listening on http://192.168.4.1/");
}

void handleHttpClient() {
  server.handleClient();
}

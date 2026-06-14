#include "wifi_ap.h"

#include <WiFi.h>

#include "config.h"

namespace {

void onWifiEvent(arduino_event_id_t event, arduino_event_info_t info) {
  switch (event) {
    case ARDUINO_EVENT_WIFI_AP_STACONNECTED: {
      const auto& c = info.wifi_ap_staconnected;
      Serial.printf("[AP] station connected (mac %02x:%02x:%02x:%02x:%02x:%02x, aid=%d)\n",
                    c.mac[0], c.mac[1], c.mac[2],
                    c.mac[3], c.mac[4], c.mac[5], c.aid);
      break;
    }
    case ARDUINO_EVENT_WIFI_AP_STADISCONNECTED: {
      const auto& d = info.wifi_ap_stadisconnected;
      Serial.printf("[AP] station disconnected (mac %02x:%02x:%02x:%02x:%02x:%02x, aid=%d)\n",
                    d.mac[0], d.mac[1], d.mac[2],
                    d.mac[3], d.mac[4], d.mac[5], d.aid);
      break;
    }
    default:
      break;
  }
}

}  // namespace

IPAddress startAccessPoint() {
  WiFi.mode(WIFI_AP);
  WiFi.onEvent(onWifiEvent);

#if AP_USE_PASSWORD
  bool ok = WiFi.softAP(AP_SSID, AP_PASSWORD);
#else
  bool ok = WiFi.softAP(AP_SSID);
#endif

  if (!ok) {
    Serial.println("[AP] softAP failed to start");
    return IPAddress(0, 0, 0, 0);
  }

  IPAddress ip = WiFi.softAPIP();
  Serial.println();
  Serial.println("===========================================");
  Serial.printf("[AP] SSID:     %s\n", AP_SSID);
#if AP_USE_PASSWORD
  Serial.printf("[AP] Password: %s\n", AP_PASSWORD);
#else
  Serial.println("[AP] Open network (no password)");
#endif
  Serial.printf("[AP] IP:       %s\n", ip.toString().c_str());
  Serial.println("===========================================");
  Serial.println();
  return ip;
}

uint8_t stationCount() {
  return WiFi.softAPgetStationNum();
}

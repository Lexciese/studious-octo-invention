import type { NextConfig } from "next";

const isEspBuild = process.env.BUILD_TARGET === "esp";

const nextConfig: NextConfig = {
  // Static export for the ESP32 firmware to bundle into LittleFS. The ESP32
  // serves this output directly from http://192.168.4.1/.
  ...(isEspBuild
    ? {
        output: "export",
        images: { unoptimized: true },
      }
    : {}),
};

export default nextConfig;

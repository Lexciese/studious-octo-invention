#!/usr/bin/env bash
# Builds the Next.js dashboard as a static export and copies it into the
# firmware's data directory for SPIFFS upload. Run this before both
# `pio run -t upload` and `pio run -t uploadfs`.
#
# Usage:
#   cd firmware
#   ./scripts/build-dashboard.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FW_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$FW_DIR/.." && pwd)"
DASHBOARD_DIR="$REPO_ROOT/dashboard"
DATA_DIR="$FW_DIR/data"

if [[ ! -d "$DASHBOARD_DIR" ]]; then
  echo "error: dashboard directory not found at $DASHBOARD_DIR" >&2
  exit 1
fi

echo "==> Building dashboard static export (npm run build:esp)"
cd "$DASHBOARD_DIR"
npm run build:esp

OUT_DIR="$DASHBOARD_DIR/out"
if [[ ! -f "$OUT_DIR/index.html" ]]; then
  echo "error: $OUT_DIR/index.html not found — build failed?" >&2
  exit 1
fi

echo "==> Clearing $DATA_DIR"
rm -rf "$DATA_DIR"
mkdir -p "$DATA_DIR"

echo "==> Copying dashboard/out/* → firmware/data/"
cp -r "$OUT_DIR"/. "$DATA_DIR/"

# PlatformIO's WebServer won't auto-serve precompressed variants, so strip them
# to avoid wasting flash on files the browser would never receive.
echo "==> Stripping .br / .gz precompressed variants"
find "$DATA_DIR" -type f \( -name '*.br' -o -name '*.gz' \) -delete

# Strip Next.js metadata debug files — not needed on the ESP32 and they waste
# scarce SPIFFS space.
find "$DATA_DIR" -name '__next.*.txt' -delete

# Strip .woff2 font files — the old mklittlefs tool shipped with PlatformIO
# can't open filenames with Next.js's double-dot content hash. Browsers fall
# back gracefully to system fonts without them.
find "$DATA_DIR" -name '*.woff2' -delete

# Keep .gitkeep tracked even when data/ is gitignored as a build artifact.
touch "$DATA_DIR/.gitkeep"

echo "==> Done. Next: pio run -t upload && pio run -t uploadfs"

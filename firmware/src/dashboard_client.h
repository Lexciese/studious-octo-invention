#ifndef DASHBOARD_CLIENT_H
#define DASHBOARD_CLIENT_H

#include "types.h"

// POST the reading to /api/sensors/ingest on the dashboard. Returns true on a
// successful 2xx response. Logs errors to serial.
bool postReading(const SensorReading& reading);

// GET /api/siram/command from the dashboard. On a 2xx response with
// pending:true, writes the command to `out` and returns true. Returns false on
// any error or when no command is pending.
bool pollCommand(SiramCommand& out);

#endif // DASHBOARD_CLIENT_H

import { setLatestReading } from "@/lib/deviceState";
import type { SensorReading } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: Partial<SensorReading>;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { ok: false, error: "invalid JSON body" },
      { status: 400 }
    );
  }

  const required: (keyof SensorReading)[] = [
    "temperatureC",
    "humidityPct",
    "soilMoisturePct",
    "lightLux",
    "deviceId",
    "timestamp",
  ];
  for (const key of required) {
    if (body[key] === undefined || body[key] === null) {
      return Response.json(
        { ok: false, error: `missing field: ${key}` },
        { status: 400 }
      );
    }
  }

  setLatestReading(body as SensorReading);
  return new Response(null, { status: 204 });
}

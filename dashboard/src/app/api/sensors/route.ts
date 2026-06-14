import { getLatestReading, getReceivedAt } from "@/lib/deviceState";
import { ensureMockDevice } from "@/lib/mockDevice";
import type { SensorsResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  ensureMockDevice();
  const payload: SensorsResponse = {
    reading: getLatestReading(),
    receivedAt: getReceivedAt(),
  };
  return Response.json(payload);
}

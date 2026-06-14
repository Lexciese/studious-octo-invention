import { queueSiramCommand } from "@/lib/deviceState";
import type { SiramTriggerBody, SiramTriggerResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: SiramTriggerBody = {};
  try {
    body = (await request.json()) as SiramTriggerBody;
  } catch {
    body = {};
  }

  const source = body.source ?? "web";
  const cmd = queueSiramCommand(source);
  const payload: SiramTriggerResponse = {
    ok: true,
    queued: true,
    queuedAt: cmd.queuedAt,
  };
  return Response.json(payload);
}

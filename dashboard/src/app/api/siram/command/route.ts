import { consumeSiramCommand } from "@/lib/deviceState";
import type { SiramCommandResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const cmd = consumeSiramCommand();
  if (!cmd) {
    const empty: SiramCommandResponse = { pending: false };
    return Response.json(empty);
  }

  const payload: SiramCommandResponse = {
    pending: true,
    queuedAt: cmd.queuedAt,
  };
  return Response.json(payload);
}

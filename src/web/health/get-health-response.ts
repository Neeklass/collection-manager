import { createGetApplicationHealth } from "@/application/health/get-application-health";
import { systemClock } from "@/infrastructure/time/system-clock";

const getApplicationHealth = createGetApplicationHealth(systemClock);

export async function getHealthResponse(): Promise<Response> {
  return Response.json(await getApplicationHealth());
}

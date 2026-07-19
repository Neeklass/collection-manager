import { getHealthResponse } from "@/web/health/get-health-response";

export async function GET(): Promise<Response> {
  return getHealthResponse();
}

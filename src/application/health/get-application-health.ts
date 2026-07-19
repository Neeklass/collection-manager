import type { ApplicationHealth } from "@/domain/health/application-health";
import type { ApplicationClock } from "@/application/ports/application-clock";

export type GetApplicationHealth = () => Promise<ApplicationHealth>;

export function createGetApplicationHealth(
  clock: ApplicationClock,
): GetApplicationHealth {
  return async (): Promise<ApplicationHealth> => ({
    status: "ok",
    checkedAt: clock.now().toISOString(),
  });
}

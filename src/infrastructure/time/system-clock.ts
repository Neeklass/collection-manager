import type { ApplicationClock } from "@/application/ports/application-clock";

export const systemClock: ApplicationClock = {
  now: (): Date => new Date(),
};

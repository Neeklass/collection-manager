export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { ConfigurationError, getApplicationConfiguration } =
      await import("@/infrastructure/configuration/application-configuration");

    try {
      getApplicationConfiguration();
    } catch (error: unknown) {
      if (!(error instanceof ConfigurationError)) {
        throw error;
      }

      console.error(`Invalid application configuration: ${error.message}`);
      process.exit(1);
    }
  }
}

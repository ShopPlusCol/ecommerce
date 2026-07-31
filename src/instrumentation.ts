import { logger } from "@/modules/observability/logger";

export function register() {
  logger.info("application.started", {
    runtime: process.env.NEXT_RUNTIME ?? "nodejs",
    environment: process.env.NODE_ENV ?? "unknown",
    revision: process.env.APP_REVISION ?? "local",
  });
}

import Fastify from "fastify";
import fastifyPrintRoutes from "fastify-print-routes";
import { HOST, PORT } from "./config/env";
import { healthRoutes } from "./api/healthRoutes";
import { regionsRoutes } from "./api/regionsRoutes";
import { statusRoutes } from "./api/statusRoutes";
import { debugRegionRoutes } from "./api/debugRegionRoutes";
import { debugUpstreamRoutes } from "./api/debugUpstreamRoutes";
import { startIngestionPoller } from "./ingestion";

export const buildServer = () => {
  const fastify = Fastify({
    logger: true
  });

  void fastify.register(fastifyPrintRoutes);
  void fastify.register(healthRoutes);
  void fastify.register(regionsRoutes);
  void fastify.register(statusRoutes);
  void fastify.register(debugRegionRoutes);
  void fastify.register(debugUpstreamRoutes);

  return fastify;
};

const start = async () => {
  const basePort = PORT;
  const maxOffset = 20;

  for (let offset = 0; offset <= maxOffset; offset += 1) {
    const currentPort = basePort + offset;
    const fastify = buildServer();

    try {
      await fastify.listen({
        host: HOST,
        port: currentPort
      });

      startIngestionPoller();

      const displayHost = HOST === "0.0.0.0" ? "localhost" : HOST;
      const url = `http://${displayHost}:${currentPort}/v1/health`;

      fastify.log.info(`SafeLight backend listening at ${url}`);

      return;
    } catch (err: any) {
      fastify.log.error(err);

      if (err?.code === "EADDRINUSE" && offset < maxOffset) {
        fastify.log.warn(
          `Port ${currentPort} is in use, retrying with port ${
            currentPort + 1
          }`
        );
        await fastify.close().catch(() => undefined);
        continue;
      }

      await fastify.close().catch(() => undefined);
      process.exit(1);
    }
  }
};

if (require.main === module) {
  void start();
}


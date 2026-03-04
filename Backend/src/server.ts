import Fastify from "fastify";
import { HOST, PORT } from "./config/env";
import { healthRoutes } from "./api/healthRoutes";
import { regionsRoutes } from "./api/regionsRoutes";
import { statusRoutes } from "./api/statusRoutes";
import { startIngestionPoller } from "./ingestion";

export const buildServer = () => {
  const fastify = Fastify({
    logger: true
  });

  void fastify.register(healthRoutes);
  void fastify.register(regionsRoutes);
  void fastify.register(statusRoutes);

  return fastify;
};

const start = async () => {
  const fastify = buildServer();

  startIngestionPoller();

  try {
    await fastify.listen({
      host: HOST,
      port: PORT
    });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

if (require.main === module) {
  void start();
}


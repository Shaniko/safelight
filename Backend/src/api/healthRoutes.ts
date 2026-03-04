import type { FastifyInstance } from "fastify";

export const healthRoutes = async (fastify: FastifyInstance): Promise<void> => {
  fastify.get("/v1/health", async () => {
    return {
      status: "ok",
      now_utc: new Date().toISOString()
    };
  });
};


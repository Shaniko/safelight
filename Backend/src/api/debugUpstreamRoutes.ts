import type { FastifyInstance } from "fastify";
import { getLastUpstreamDebug } from "../official/officialAdapter";

export const debugUpstreamRoutes = async (
  fastify: FastifyInstance
): Promise<void> => {
  fastify.get("/v1/debug/upstream", async (_request, reply) => {
    const snapshot = getLastUpstreamDebug();

    if (!snapshot) {
      void reply.code(204);
      return null;
    }

    return snapshot;
  });
};


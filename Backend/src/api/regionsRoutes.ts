import type { FastifyInstance } from "fastify";
import { getRegions } from "../regions";

export const regionsRoutes = async (
  fastify: FastifyInstance
): Promise<void> => {
  fastify.get("/v1/regions", async () => {
    return getRegions();
  });
};


import type { FastifyInstance } from "fastify";
import { getRegionDebugFacts } from "../store";
import { isSupportedRegionId } from "../regions";

export const debugRegionRoutes = async (
  fastify: FastifyInstance
): Promise<void> => {
  fastify.get(
    "/v1/debug/region",
    async (request, reply) => {
      const { region_id } = request.query as { region_id?: string };

      if (!region_id || !isSupportedRegionId(region_id)) {
        void reply.code(400);
        return {
          error: "Invalid or unsupported region_id"
        };
      }

      const facts = getRegionDebugFacts(region_id);
      return facts;
    }
  );
};


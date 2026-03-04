import type { FastifyInstance } from "fastify";
import { getRegionStatus } from "../store";
import { isSupportedRegionId } from "../regions";

export const statusRoutes = async (
  fastify: FastifyInstance
): Promise<void> => {
  fastify.get(
    "/v1/status",
    async (request, reply) => {
      const { region_id } = request.query as { region_id?: string };

      if (!region_id || !isSupportedRegionId(region_id)) {
        void reply.code(400);
        return {
          error: "Invalid or unsupported region_id"
        };
      }

      const status = getRegionStatus(region_id);

      return status;
    }
  );
};


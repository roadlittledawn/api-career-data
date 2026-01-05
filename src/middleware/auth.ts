// API key authentication middleware
import { FastifyRequest, FastifyReply } from "fastify";
import { logError, ErrorCodes } from "../utils/errors.js";

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const apiKey = request.headers["x-api-key"];
  const expectedKey = process.env.API_ACCESS_KEY;

  if (!expectedKey) {
    logError(new Error("API_ACCESS_KEY environment variable is not set"), {
      context: "auth-middleware",
    });
    return reply.status(500).send({
      errors: [
        {
          message: "Server configuration error",
          extensions: { code: ErrorCodes.INTERNAL_SERVER_ERROR },
        },
      ],
    });
  }

  if (!apiKey) {
    return reply.status(401).send({
      errors: [
        {
          message: "API key is required",
          extensions: { code: ErrorCodes.UNAUTHENTICATED },
        },
      ],
    });
  }

  if (apiKey !== expectedKey) {
    logError(new Error("Invalid API key provided"), {
      context: "auth-middleware",
      providedKeyLength: typeof apiKey === "string" ? apiKey.length : 0,
    });
    return reply.status(401).send({
      errors: [
        {
          message: "Invalid API key",
          extensions: { code: ErrorCodes.UNAUTHENTICATED },
        },
      ],
    });
  }
}

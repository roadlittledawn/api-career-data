// API key authentication middleware
import { FastifyRequest, FastifyReply } from "fastify";

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const apiKey = request.headers["x-api-key"];
  const expectedKey = process.env.API_ACCESS_KEY;

  if (!expectedKey) {
    request.log.error("API_ACCESS_KEY environment variable is not set");
    return reply.status(500).send({ error: "Server configuration error" });
  }

  if (!apiKey) {
    return reply.status(401).send({ error: "API key is required" });
  }

  if (apiKey !== expectedKey) {
    return reply.status(401).send({ error: "Invalid API key" });
  }
}

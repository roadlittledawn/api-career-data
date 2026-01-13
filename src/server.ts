import "dotenv/config";
import Fastify, { FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import mercurius from "mercurius";
import awsLambdaFastify from "@fastify/aws-lambda";
import type {
  Context,
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from "aws-lambda";
import { schema } from "./schema/index.js";
import { resolvers } from "./schema/resolvers.js";
import { authMiddleware } from "./middleware/auth.js";
import { createErrorFormatter } from "./utils/errors.js";

/**
 * Creates and configures the Fastify server instance.
 * This function sets up:
 * - CORS for cross-origin requests
 * - Authentication middleware (preHandler hook)
 * - Mercurius GraphQL plugin with schema and resolvers
 * - Error formatting for GraphQL responses
 *
 * Requirements: 11.1, 11.2
 */
export async function buildServer(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: true,
  });

  // Register CORS - allows requests from any origin
  // This is appropriate for a personal API with API key authentication
  await app.register(cors, {
    origin: true,
  });

  // Register authentication middleware as preHandler hook
  // This runs before every request and validates the X-API-Key header
  // Requirements: 9.1, 9.2, 9.3
  app.addHook("preHandler", authMiddleware);

  // Register Mercurius GraphQL plugin
  // Requirements: 11.1, 11.2, 11.3, 11.4
  await app.register(mercurius, {
    schema,
    resolvers,
    // Enable GraphiQL interface in non-production environments
    graphiql: process.env.NODE_ENV !== "production",
    // Custom error formatter for GraphQL-compliant error responses
    errorFormatter: createErrorFormatter(),
  });

  return app;
}

// Cached server instance for Lambda warm starts
let cachedApp: FastifyInstance | null = null;

/**
 * Gets or creates the Fastify server instance.
 * Caches the instance for Lambda warm starts to improve performance.
 * Requirements: 10.3
 */
async function getApp(): Promise<FastifyInstance> {
  if (!cachedApp) {
    cachedApp = await buildServer();
  }
  return cachedApp;
}

// Cached Lambda proxy for warm starts
let cachedProxy: awsLambdaFastify.PromiseHandler<
  APIGatewayProxyEvent,
  awsLambdaFastify.LambdaResponse
> | null = null;

/**
 * Lambda handler entry point.
 * Uses @fastify/aws-lambda adapter to handle Lambda events.
 * Supports execution times up to 60 seconds for AI generation operations.
 *
 * Requirements: 10.1, 10.2
 */
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  // Ensure connection reuse for warm starts
  context.callbackWaitsForEmptyEventLoop = false;

  if (!cachedProxy) {
    const app = await getApp();
    cachedProxy = awsLambdaFastify(app) as awsLambdaFastify.PromiseHandler<
      APIGatewayProxyEvent,
      awsLambdaFastify.LambdaResponse
    >;
  }

  const response = await cachedProxy(event, context);
  return response as APIGatewayProxyResult;
};

/**
 * Starts the server for local development.
 * Only runs when NODE_ENV is not "production".
 */
async function startDevServer(): Promise<void> {
  try {
    const app = await buildServer();
    await app.listen({ port: 3000, host: "0.0.0.0" });
    console.log("Server running at http://localhost:3000/graphql");
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

// Start development server if not in production
if (process.env.NODE_ENV !== "production") {
  startDevServer();
}

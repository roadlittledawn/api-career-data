import Fastify from "fastify";
import cors from "@fastify/cors";
import mercurius from "mercurius";
import awsLambdaFastify from "@fastify/aws-lambda";
import { schema } from "./schema/index.js";
import { resolvers } from "./schema/resolvers.js";
import { authMiddleware } from "./middleware/auth.js";

const app = Fastify({
  logger: true,
});

// Register CORS
await app.register(cors, {
  origin: true,
});

// Register authentication middleware
app.addHook("preHandler", authMiddleware);

// Register Mercurius GraphQL
await app.register(mercurius, {
  schema,
  resolvers,
  graphiql: process.env.NODE_ENV !== "production",
});

// Lambda handler
export const handler = awsLambdaFastify(app);

// For local development
if (process.env.NODE_ENV !== "production") {
  const start = async () => {
    try {
      await app.listen({ port: 3000, host: "0.0.0.0" });
      console.log("Server running at http://localhost:3000/graphql");
    } catch (err) {
      app.log.error(err);
      process.exit(1);
    }
  };
  start();
}

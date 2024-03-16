import proceduresRouter from "@/server/api/routers/proceduresRouter";
import { createTRPCRouter, mergeRouters } from "@/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = mergeRouters(
  proceduresRouter,
  createTRPCRouter({
    // additional namespaced routers go here
  }),
);

// export type definition of API
export type AppRouter = typeof appRouter;

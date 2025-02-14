import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";

export const reportRouter = createTRPCRouter({

  create: protectedProcedure
    .input(z.object({ hierarchy: z.string().min(1) }))
    .mutation(async ({ ctx, input }): Promise<void> => {
      // Currently empty implementation
    }),
});

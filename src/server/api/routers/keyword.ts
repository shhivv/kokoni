import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const keywordRouter = createTRPCRouter({
  processKeyword: protectedProcedure
    .input(z.string())
    .mutation(async ({ input }): Promise<{ keyword: string; message: string }> => {
      // Return a JSON object based on the string input.
      return { keyword: input, message: `Received keyword: ${input}` };
    }),
});

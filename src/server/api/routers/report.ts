import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";

export const reportRouter = createTRPCRouter({
  produceReport: protectedProcedure
    // Accept any JSON object using passthrough so that extra fields are allowed.
    .input(z.object({}).passthrough())
    .mutation(async ({ ctx, input }): Promise<{ markdown: string }> => {
      // Hardcoded markdown text
      const markdownText = `
# Hardcoded Report

This report is generated based on the provided input.

- Analysis point one
- Analysis point two

Thank you for using our service!
      `;
      
      return { markdown: markdownText };
    }),
});

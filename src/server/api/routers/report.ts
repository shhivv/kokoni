import { z } from "zod";
import { TavilySearchAPIClient } from "@tavily/js";
import { groq } from "@ai-sdk/groq";
import { env } from "~/env";

import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";

export const reportRouter = createTRPCRouter({
  produceReport: protectedProcedure
    // Accept any JSON object using passthrough so that extra fields are allowed.
    .input(z.object({}).passthrough())
    .mutation(async ({ ctx, input }): Promise<{ markdown: string }> => {
      // now given a list of keywords as arrays, use the tavily api to perform 1 search
      // for each keyword, and then compile the content presented
      // and present it to the groq model and make it produce a detailed report from that
      //and return that
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

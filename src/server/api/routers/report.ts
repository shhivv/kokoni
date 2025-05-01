import { z } from "zod";
import { tavily } from "@tavily/core";
import { env } from "~/env";
import { streamText } from "ai";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { xai } from "@ai-sdk/xai";
const tvly = tavily({ apiKey: env.TAVILY_API_KEY });

export const reportRouter = createTRPCRouter({
  produceReport: protectedProcedure
    .input(
      z.object({
        originalPrompt: z.string(),
        keywords: z.array(z.string()),
        prompt: z.string().optional(),
        searchId: z.number(),
        includeStats: z.boolean().default(false),
        includeWeb: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {})})

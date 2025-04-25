import { z } from "zod";
import { tavily } from "@tavily/core";
import { env } from "~/env";
import { streamText } from "ai";
import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";
import { xai } from "@ai-sdk/xai";
const tvly = tavily({ apiKey: env.TAVILY_API_KEY });

export const reportRouter = createTRPCRouter({
  produceReport: protectedProcedure
    .input(z.object({ 
      originalPrompt: z.string(),
      keywords: z.array(z.string()),
      prompt: z.string().optional(),
      searchId: z.string(),
      includeStats: z.boolean().default(false),
      includeWeb: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      const searchPromises = input.keywords.map(keyword => 
        tvly.search(input.originalPrompt + ":" + keyword, {
          options: {
            searchDepth: "basic",
          },
        })
      );

      const searchResults = await Promise.all(searchPromises);
      const compiledResults = input.keywords.map((keyword, index) => ({
        keyword,
        content: searchResults[index]?.results
          .map(r => r.content)
          .join('\n\n') ?? ''
      }));

      // Construct additional instructions based on flags
      const additionalInstructions = [
        input.prompt ?? '',
        input.includeStats ? 'Include statistical analysis and data-driven insights where possible.' : '',
        input.includeWeb ? 'Focus on web-specific information and online trends.' : ''
      ].filter(Boolean).join('\n');

      const { textStream } = streamText({
        // @ts-expect-error model xai
        model: xai("grok-3-mini"),
        prompt: `Create a detailed report based on the following research:
QUESTION: ${input.originalPrompt}

RESEARCH:
${compiledResults.map(r => `## ${r.keyword}\n${r.content}`).join('\n\n')}

Additional instructions: ${additionalInstructions}

Requirements:
1. Use Markdown format
2. Create a cohesive narrative connecting all topics
3. Include relevant quotes or data from the research
4. Organize with clear headings and subheadings
5. Use bullet points for key findings
6. Add a summary section at the end

The report should synthesize the information and make connections between the topics.`,
      });

      let fullText = '';
      for await (const chunk of textStream) {
        const cleanChunk = chunk.replace(/^# /, '').replace(/<\/?think>/g, '');
        fullText += cleanChunk;
      }

      await ctx.db.report.update({
        where: { searchId: input.searchId },
        data: {
          contents: fullText,
        },
      });

      return { success: true };
    }),
});

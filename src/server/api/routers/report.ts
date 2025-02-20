import { z } from "zod";
import { tavily } from "@tavily/core";
import { groq } from "@ai-sdk/groq";
import { env } from "~/env";
import { generateObject } from "ai";
import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";

const tvly = tavily({ apiKey: env.TAVILY_API_KEY });

export const reportRouter = createTRPCRouter({
  produceReport: protectedProcedure
    .input(z.object({ 
      keywords: z.array(z.string()),
      prompt: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }): Promise<{ markdown: string }> => {
      // Search for each keyword
      const searchPromises = input.keywords.map(keyword => 
        tvly.search(keyword, {
          options: {
            searchDepth: "basic",
          },
        })
      );

      const searchResults = await Promise.all(searchPromises);

      // Compile search results by keyword
      const compiledResults = input.keywords.map((keyword, index) => ({
        keyword,
        content: searchResults[index]?.results
          .map(r => r.content)
          .join('\n\n') || ''
      }));

      // Generate report using the search results
      const markdownText = await generateObject({
        model: groq("mixtral-8x7b-32768"),
        schema: z.object({
          report: z.string(),
        }),
        prompt: `Create a detailed report based on the following research:

${compiledResults.map(r => `## ${r.keyword}\n${r.content}`).join('\n\n')}

Additional instructions: ${input.prompt || ''}

Requirements:
1. Use Markdown format
2. Create a cohesive narrative connecting all topics
3. Include relevant quotes or data from the research
4. Organize with clear headings and subheadings
5. Use bullet points for key findings
6. Add a summary section at the end

The report should synthesize the information and make connections between the topics.`,
      }).then(response => response.object.report);
      
      return { markdown: markdownText };
    }),
});

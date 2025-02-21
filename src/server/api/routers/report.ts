import { z } from "zod";
import { tavily } from "@tavily/core";
import { env } from "~/env";
import { generateText } from "ai";
import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";
import { groq } from "@ai-sdk/groq";
const tvly = tavily({ apiKey: env.TAVILY_API_KEY });

export const reportRouter = createTRPCRouter({
  produceReport: protectedProcedure
    .input(z.object({ 
      originalPrompt: z.string(),
      keywords: z.array(z.string()),
      prompt: z.string().optional(),
      searchId: z.string(),
    }))
    .mutation(async ({ ctx, input }): Promise<{ markdown: string }> => {
      // Search for each keyword
      const searchPromises = input.keywords.map(keyword => 
        tvly.search(input.originalPrompt + ":" + keyword , {
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
          .join('\n\n') ?? ''
      }));
      console.log(compiledResults)
      // Generate report using the search results
      const markdownText = await generateText({
        model: groq("gemma2-9b-it"),
        prompt: `Create a detailed report based on the following research:
QUESTION: ${input.originalPrompt}

RESEARCH:
${compiledResults.map(r => `## ${r.keyword}\n${r.content}`).join('\n\n')}

Additional instructions: ${input.prompt ?? ''}

Requirements:
1. Use Markdown format
2. Create a cohesive narrative connecting all topics
3. Include relevant quotes or data from the research
4. Organize with clear headings and subheadings
5. Use bullet points for key findings
6. Add a summary section at the end

The report should synthesize the information and make connections between the topics.`,
      });
      
      // Save the report to the database
      await ctx.db.report.update({
        where: { searchId: input.searchId },
        data: {
          contents: markdownText.text.replace(/^# /, '').replace(/<\/?think>/g, '') ,
        },
      });

      return { markdown: markdownText.text.replace(/^# /, '').replace(/<\/?think>/g, '') };
    }),
});

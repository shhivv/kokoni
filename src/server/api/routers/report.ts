import { z } from "zod";
import { tavily } from "@tavily/core";
import { env } from "~/env";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { xai } from "@ai-sdk/xai";
const tvly = tavily({ apiKey: env.TAVILY_API_KEY });
import { generateText } from "ai";
import { google } from "@ai-sdk/google";

export const reportRouter = createTRPCRouter({
  produceReport: protectedProcedure
    .input(
      z.object({
        searchId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { searchId } = input;
      const results = [];

      // Fetch all nodes for this search from the database
      const nodes = await ctx.db.node.findMany({
        where: {
          searchId: searchId,
          selected: true
        },
        include: {
          parent: true // Include parent node data
        }
      });

      for (const node of nodes) {
        // Prepare context for the AI model
        const nodeContext = {
          nodeQuestion: node.question || "",
          nodeSummary: node.summary || "",
          parentQuestion: node.parent?.question || "",
          parentSummary: node.parent?.summary || "",
          searchId: searchId
        };

        // Optional: Use tavily to get additional information if needed
        let searchResults = "";
        if (node.question) {
          try {
            const searchResponse = await tvly.search(node.question, {
              options: {
                searchDepth: "basic",
                maxResults: 3,
              },
            });
            searchResults = searchResponse.results.map(r => r.content).join(" ");
          } catch (error) {
            console.error("Tavily search error:", error);
          }
        }

        // Generate content using groq
        const prompt = `
Based on the following information:
- Node question: ${nodeContext.nodeQuestion}
- Node summary: ${nodeContext.nodeSummary}
- Parent question: ${nodeContext.parentQuestion}
- Parent summary: ${nodeContext.parentSummary}
- Additional research: ${searchResults}

Create a single comprehensive paragraph in markdown format.
The paragraph should be well-structured, informative, and integrate all relevant information from the context provided.

Important: Focus on directly answering the question without general introductory statements or background information.
For example, if asked "Why does a car run on petrol?", start directly with the explanation of the combustion process
rather than explaining what a car is or its general uses.

Format the response exactly as follows (a single paragraph):
[Your single paragraph content here]
`;

        try {
          const response = await generateText({
            model: google("gemini-1.5-flash"),
            prompt: prompt,
            maxTokens: 500
          });

          const content = response.text;

          // Store the generated content in the database
          const reportBlock = await ctx.db.reportBlock.upsert({
            where: {
              nodeId: node.id
            },
            create: {
              heading: node.question || "Node",
              content: content,
              nodeId: node.id
            },
            update: {
              content: content
            }
          });

          // Add result to the array
          results.push({
            nodeId: node.id,
            content: content,
            reportBlockId: reportBlock.id
          });
        } catch (error) {
          console.error("AI generation error:", error);
          const errorContent = `### Error Processing ${node.question || "Node"}\nUnable to generate content due to an error.`;
          
          // Store error content in the database
          const reportBlock = await ctx.db.reportBlock.upsert({
            where: {
              nodeId: node.id
            },
            create: {
              heading: node.question || "Node",
              content: errorContent,
              nodeId: node.id
            },
            update: {
              content: errorContent
            }
          });

          results.push({
            nodeId: node.id,
            content: errorContent,
            reportBlockId: reportBlock.id
          });
        }
      }

      return { results };
    }),

  getReport: protectedProcedure
    .input(z.object({
      searchId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const { searchId } = input;

      const reportBlocks = await ctx.db.reportBlock.findMany({
        where: {
          node: {
            searchId: searchId
          }
        },
        orderBy: {
          nodeId: "asc"
        }
      });

      return reportBlocks;
    }),

  updateReportBlock: protectedProcedure
    .input(z.object({
      reportBlockId: z.number(),
      content: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { reportBlockId, content } = input;

      const updatedBlock = await ctx.db.reportBlock.update({
        where: {
          id: reportBlockId
        },
        data: {
          content: content
        }
      });

      return updatedBlock;
    })
});
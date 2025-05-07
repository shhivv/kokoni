import { z } from "zod";
import { tavily } from "@tavily/core";
import { env } from "~/env";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { xai } from "@ai-sdk/xai";
const tvly = tavily({ apiKey: env.TAVILY_API_KEY });
import { Node } from "../../../types/NodeInterface";
import { generateText } from "ai";

export const reportRouter = createTRPCRouter({
  produceReport: protectedProcedure
    .input(
      z.object({
        searchId: z.string(),
        nodes: z.array(z.custom<Node>()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { searchId, nodes } = input;
      const results = [];

      for (const node of nodes) {
        // Find parent node if it exists
        const parentNode = node.parentId ? nodes.find(n => n.id === node.parentId) : null;
        
        // Prepare context for the AI model
        const nodeContext = {
          nodeQuestion: node.question || "",
          nodeSummary: node.summary || "",
          parentQuestion: parentNode?.question || "",
          parentSummary: parentNode?.summary || "",
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

Create a single comprehensive paragraph in markdown format with an h3 heading that addresses the node question. 
The paragraph should be well-structured, informative, and integrate all relevant information from the context provided.
The heading should be related to the node question.

Format the response exactly as follows (with the ### heading and a single paragraph):
### [Your heading here]
[Your single paragraph content here]
`;

        try {
          const response = await generateText({
            // @ts-expect-error model
            model: xai("grok-2-mini"),
            prompt: prompt,
            maxTokens: 500
          });

          const content = response.toString();

          // Store the generated content in the database
          const reportBlock = await ctx.db.reportBlock.upsert({
            where: {
              nodeId: node.id
            },
            create: {
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
    })
});

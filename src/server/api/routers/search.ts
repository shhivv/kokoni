import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { tavily } from "@tavily/core";
import { env } from "~/env";

const tvly = tavily({ apiKey: env.TAVILY_API_KEY });

export const searchRouter = createTRPCRouter({
  // GET /searches
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.search.findMany({
      where: {
        createdById: ctx.session.user.id,
      },
      include: {
        KnowledgeMap: true,
        Report: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });
  }),

  // GET /search/<id> (protected)
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const search = await ctx.db.search.findUnique({
        where: {
          id: input.id,
          createdById: ctx.session.user.id,
        },
        include: {
          KnowledgeMap: true,
          Report: {
            select: {
              contents: true,
              updatedAt: true,
            },
          },
        },
      });

      if (!search) {
        throw new Error("Search not found or unauthorized");
      }

      return search;
    }),

  // GET /search/<id> (public)
  getByIdPublic: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const search = await ctx.db.search.findUnique({
        where: {
          id: input.id,
        },
        select: {
          name: true,
          Report: {
            select: {
              contents: true,
              updatedAt: true,
            },
          },
        },
      });

      if (!search) {
        throw new Error("Search not found");
      }

      return search;
    }),

  // POST /search
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        additionalInstruction: z.string().default(""),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userSearches = await ctx.db.search.count({
        where: {
          createdById: ctx.session.user.id,
        },
      });

      if (userSearches >= 5) {
        throw new Error("You have reached the maximum number of searches");
      }

      // Use Groq to structure the knowledge map
      const search = await tvly.search(input.name, {
        options: {
          searchDepth: "basic",
          maxResults: 1,
        },
      });
      const structurePrompt = `Generate three short, focused follow-up questions about the topic: "${input.name}" 

Here are some key points to consider:
${search.results.map((r) => r.content).join("\n")}

The questions should:
1. Be short and concise (aim for 5-10 words)
2. Focus on one specific aspect of the topic
3. Be easy to understand at a glance
4. Be relevant to the topic
5. Encourage exploration and discussion
6. Avoid yes/no questions

Additional instructions: ${input.additionalInstruction}

Example format (DO NOT copy these exact questions, create appropriate ones for the topic):
[
  "What started the Industrial Revolution?",
  "How did workers' lives change?",
  "What were the environmental effects?"
]

IMPORTANT: Return only the array of 3 questions as a valid JSON array without any additional text, explanations, or code blocks.`;
      const startTime = performance.now();
      const response = await generateObject({
        // @ts-expect-error model xai
        model: google("gemini-1.5-flash"),
        schema: z.object({
          questions: z.array(z.string()),
        }),
        prompt: structurePrompt,
      });
      const endTime = performance.now();
      console.log(
        `generateObject call took ${(endTime - startTime) / 1000} seconds`,
      );

      const questions = response.object.questions;

      return await ctx.db.search.create({
        data: {
          name: input.name,
          additionalInstruction: input.additionalInstruction,
          createdById: ctx.session.user.id,
          KnowledgeMap: {
            create: {
              contents: questions,
            },
          },
          Report: {
            create: {
              contents: "No report available yet.",
            },
          },
        },
        include: {
          KnowledgeMap: true,
          Report: true,
        },
      });
    }),

  // DELETE /search/<id>
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const search = await ctx.db.search.findUnique({
        where: {
          id: input.id,
          createdById: ctx.session.user.id,
        },
      });

      if (!search) {
        throw new Error("Search not found or unauthorized");
      }

      // Delete the search (cascade will handle related records)
      await ctx.db.search.delete({
        where: {
          id: input.id,
        },
      });

      return { success: true };
    }),

  // PUT /search/<id>
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        additionalInstruction: z.string().optional(),
        knowledgeMap: z.record(z.any()).optional(),
        report: z.record(z.any()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // First verify ownership
      const search = await ctx.db.search.findUnique({
        where: {
          id: input.id,
          createdById: ctx.session.user.id,
        },
      });

      if (!search) {
        throw new Error("Search not found or unauthorized");
      }

      // Update search and related records
      return await ctx.db.$transaction(async (tx) => {
        // Update search basic info if provided
        if (input.name || input.additionalInstruction) {
          await tx.search.update({
            where: { id: input.id },
            data: {
              name: input.name,
              additionalInstruction: input.additionalInstruction,
            },
          });
        }

        // Update knowledge map if provided
        if (input.knowledgeMap) {
          await tx.knowledgeMap.update({
            where: { searchId: input.id },
            data: {
              contents: input.knowledgeMap,
            },
          });
        }

        // Update report if provided
        if (input.report) {
          await tx.report.update({
            where: { searchId: input.id },
            data: {
              contents: input.report,
            },
          });
        }

        // Return updated search with all relations
        return await tx.search.findUnique({
          where: { id: input.id },
          include: {
            KnowledgeMap: true,
            Report: true,
          },
        });
      });
    }),

  // POST /search/summary
  summary: protectedProcedure
    .input(z.object({ question: z.string() }))
    .mutation(async ({ input }) => {
      const summaryPrompt = `Create a very short summary (max 100 characters) answering this question: "${input.question}"

Requirements:
1. Be extremely concise
2. Focus on the key point
3. Use simple language
4. Stay under 100 characters
5. Return only the summary text, no quotes or additional text

Example format:
The Industrial Revolution began with steam power and mechanization, transforming manufacturing and society.`;

      const response = await generateObject({
        // @ts-expect-error model xai
        model: google("gemini-1.5-flash"),
        schema: z.object({
          summary: z.string().max(100),
        }),
        prompt: summaryPrompt,
      });

      return response.object.summary;
    }),
});

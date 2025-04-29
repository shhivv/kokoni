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
        rootNode: {
          include: {
            children: true,
          },
        },
        Report: {
          include: {
            blocks: true,
          },
        },
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
          rootNode: {
            include: {
              children: true,
            },
          },
          Report: {
            include: {
              blocks: true,
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
          query: true,
          Report: {
            select: {
              blocks: {
                select: {
                  content: true,
                  updatedAt: true,
                },
              },
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
        query: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userSearches = await ctx.db.search.count({
        where: {
          createdById: ctx.session.user.id,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
      });

      if (userSearches >= 5) {
        throw new Error("You have reached the maximum number of searches for today");
      }

      const searchResults = await tvly.search(input.query, {
        options: {
          searchDepth: "basic",
          maxResults: 3,
        },
      });

      const structurePrompt = `Transform the topic "${input.query}" into a main question and generate two related sub-questions.

Here are some key points to consider:
${searchResults.results.map((r) => r.content).join("\n")}

Requirements:
1. Main question should be broad and capture the essence of the topic
2. Sub-questions should be more specific and explore different aspects
3. All questions should be clear and concise (5-15 words)
4. Questions should encourage exploration and discussion
5. Avoid yes/no questions
6. Sub-questions should naturally follow from the main question

Example format (DO NOT copy these exact questions, create appropriate ones for the topic):
{
  "mainQuestion": "How did the Industrial Revolution transform society?",
  "subQuestions": [
    "What were the key technological innovations that drove change?",
    "How did the Industrial Revolution affect social class structures?"
  ]
}

IMPORTANT: Return only a valid JSON object with the mainQuestion and subQuestions fields, without any additional text or explanations.`;

      const response = await generateObject({
        // @ts-expect-error model
        model: google("gemini-1.5-flash"),
        schema: z.object({
          mainQuestion: z.string(),
          subQuestions: z.array(z.string()),
        }),
        prompt: structurePrompt,
      });

      const { mainQuestion, subQuestions } = response.object;

      // First create the search
      const search = await ctx.db.search.create({
        data: {
          query: input.query,
          createdById: ctx.session.user.id,
          rootNode: {
            create: {
              question: mainQuestion,
            },
          },
          Report: {
            create: {
              blocks: {
                create: {
                  content: "Initial report block",
                  order: 0,
                  includeStats: false,
                  includeImage: false,
                },
              },
            },
          },
        },
      });

      // Then create child nodes using the search ID
      await ctx.db.node.createMany({
        data: subQuestions.map(question => ({
          question: question,
          searchId: search.id,
        })),
      });

      return search;
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
        query: z.string().optional(),
        rootNode: z.object({
          question: z.string(),
          children: z.array(z.object({
            question: z.string(),
          })),
        }).optional(),
        report: z.array(z.object({
          content: z.string(),
          order: z.number(),
          includeStats: z.boolean(),
          includeImage: z.boolean(),
        })).optional(),
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
        if (input.query) {
          await tx.search.update({
            where: { id: input.id },
            data: {
              query: input.query,
            },
          });
        }

        // Update root node if provided
        if (input.rootNode) {
          await tx.node.update({
            where: { searchId: input.id },
            data: {
              question: input.rootNode.question,
              children: {
                deleteMany: {},
                create: input.rootNode.children.map(child => ({
                  question: child.question,
                  search: { connect: { id: input.id } },
                })),
              },
            },
          });
        }

        // Update report blocks if provided
        if (input.report) {
          const reportId = (await tx.report.findUnique({
            where: { searchId: input.id },
            select: { id: true },
          }))?.id;

          if (!reportId) {
            throw new Error("Report not found");
          }

          await tx.reportBlock.deleteMany({
            where: { reportId },
          });
          await tx.reportBlock.createMany({
            data: input.report.map(block => ({
              content: block.content,
              order: block.order,
              includeStats: block.includeStats,
              includeImage: block.includeImage,
              reportId,
            })),
          });
        }

        // Return updated search with all relations
        return await tx.search.findUnique({
          where: { id: input.id },
          include: {
            rootNode: {
              include: {
                children: true,
              },
            },
            Report: {
              include: {
                blocks: true,
              },
            },
          },
        });
      });
    }),

  // POST /search/summary
  summary: protectedProcedure
    .input(z.object({ question: z.string() }))
    .mutation(async ({ input }) => {
      const summaryPrompt = `Create a very short summary (max 300 characters) answering this question: "${input.question}"

Requirements:
1. Be concise
2. Focus on the key point
3. Use simple language
4. Stay under 300 characters
5. Return only the summary text, no quotes or additional text

Example format:
The British Industrial Revolution negatively impacted India, transforming it into a supplier of raw materials and a market for British goods, hindering its own industrial development and causing economic exploitation.`;

      const response = await generateObject({
        // @ts-expect-error model
        model: google("gemini-1.5-flash"),
        schema: z.object({
          summary: z.string().max(300),
        }),
        prompt: summaryPrompt,
      });

      return response.object.summary;
    }),
});

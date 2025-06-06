import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { xai } from "@ai-sdk/xai";
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
      const structurePrompt = `Create a hierarchical knowledge map structure as a JSON object for the topic: "${input.name}" 

Here are some key points to consider:
${search.results.map((r) => r.content).join("\n")}

The structure should be nested with related concepts grouped together. Focus on key concepts, subtopics, and their relationships.

Additional instructions: ${input.additionalInstruction}

Requirements:
1. Your response must be a valid JSON object without any additional text
2. Use nested objects and arrays to show hierarchy
3. Keep the structure focused and relevant to the topic
4. Include important subtopics and related concepts
5. Make connections between related ideas
6. Use clear, human-readable labels with spaces instead of underscores (e.g., "Campus Response" instead of "campus_response")
7. Ensure the response does not contain any string to string key-value pairs in the JSON structure

Example format (DO NOT copy this exact structure, create an appropriate one for the topic):
{
  "Industrial Revolution": [
    "1760-1840",
    "Great Britain",
    {
      "Key Invention": [
        "Steam engine",
        "Power loom",
        "Cotton gin",
        {
          "Transportation": [
            "Railway",
            "Steamboat",
            "Locomotive"
          ]
        }
      ]
    },
    {
      "Social Changes": [
        "Urbanization",
        "Factory system",
        "Working class",
        {
          "Living Conditions": [
            "Tenements",
            "Pollution",
            "Public health issues"
          ]
        }
      ]
    },
    {
      "Economic Impact": [
        "Mass production",
        "Capitalism",
        "Global trade",
        {
          "resources": [
            "Coal",
            "Iron",
            "Steel"
          ]
        }
      ]
    },
    [
      "Second Industrial Revolution",
      "1870-1914",
      "Electricity",
      "Oil"
    ]
  ]
}

IMPORTANT: Return only the JSON structure without any explanations, comments or code blocks. Use proper capitalization and spaces in all labels.`;
      const startTime = performance.now();
      const response = await generateObject({
        // @ts-expect-error model xai
        model: xai("grok-3-mini"),
        schema: z.object({
          knowledgeMap: z.record(z.any()),
        }),
        prompt: structurePrompt,
      });
      const endTime = performance.now();
      console.log(
        `generateObject call took ${(endTime - startTime) / 1000} seconds`,
      );

      const knowledgeMap = response.object.knowledgeMap;

      return await ctx.db.search.create({
        data: {
          name: input.name,
          additionalInstruction: input.additionalInstruction,
          createdById: ctx.session.user.id,
          KnowledgeMap: {
            create: {
              contents: knowledgeMap,
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
});

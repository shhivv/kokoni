import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";
import { groq } from "@ai-sdk/groq";
import { generateObject } from "ai";

export const searchRouter = createTRPCRouter({
  // GET /searches
  getAll: protectedProcedure
    .query(async ({ ctx }) => {
      return await ctx.db.search.findMany({
        where: {
          createdById: ctx.session.user.id,
        },
        include: {
          KnowledgeMap: true,
          Report: true,
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });
    }),

  // GET /search/<id>
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

  // POST /search
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      additionalInstruction: z.string().default(""),
    }))
    .mutation(async ({ ctx, input }) => {
      // Use Groq to structure the knowledge map
      const structurePrompt = `Create a hierarchical knowledge map structure as a JSON object for the topic: "${input.name}". 
The structure should be nested with related concepts grouped together. Focus on key concepts, subtopics, and their relationships.

Additional instructions: ${input.additionalInstruction}

Requirements:
1. Return only valid JSON
2. Use nested objects and arrays to show hierarchy
3. Keep the structure focused and relevant
4. Include important subtopics and related concepts
5. Make connections between related ideas

Example format:
{
  "main topic": {
    "subtopic1": ["related concept", "another concept"],
    "subtopic2": {
      "nested topic": ["detail1", "detail2"],
      "another nested": ["more", "details"]
    }
  }
}

Return only the JSON structure.`;

      const response = await generateObject({
        model: groq("mixtral-8x7b-32768"),
        schema: z.object({
          knowledgeMap: z.record(z.any()),
        }),
        prompt: structurePrompt,
      });

      let knowledgeMap = response.object.knowledgeMap;

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
    .input(z.object({
      id: z.string(),
      name: z.string().optional(),
      additionalInstruction: z.string().optional(),
      knowledgeMap: z.record(z.any()).optional(),
      report: z.record(z.any()).optional(),
    }))
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
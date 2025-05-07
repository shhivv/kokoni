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
import { subQuestionOnlyPrompt, subQuestionPrompt, summaryPrompt } from "~/lib/prompts";
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

      const limit = ctx.session.user.pro ? 50 : 5;
      if (userSearches >= limit) {
        throw new Error(
          "You have reached the maximum number of searches for today",
        );
      }

      const searchResults = await tvly.search(input.query, {
        options: {
          searchDepth: "basic",
          maxResults: 3,
        },
      });



      const response = await generateObject({
        model: google("gemini-1.5-flash"),
        schema: z.object({
          title: z.string().max(70),
          mainQuestion: z.string(),
          subQuestions: z.array(z.string()),
        }),
        prompt: subQuestionPrompt(input.query, searchResults),
      });

      const { title, mainQuestion, subQuestions } = response.object;

      // Generate summary for the root node
     

      const summaryResponse = await generateObject({
        model: google("gemini-1.5-flash"),
        schema: z.object({
          summary: z.string().max(300),
        }),
        prompt: summaryPrompt(mainQuestion),
      });

      // Create the search without root node
      const search = await ctx.db.search.create({
        data: {
          title,
          query: input.query,
          createdById: ctx.session.user.id,
        },
      });
      // Create root node and connect it to the search
      const rootNode = await ctx.db.node.create({
        data: {
          question: mainQuestion,
          selected: true,
          summary: summaryResponse.object.summary,
          search: {
            connect: {
              id: search.id,
            },
          },
        },
      });

      // create child nodes
      await ctx.db.node.createMany({
        data: subQuestions.map((question) => ({
          question: question,
          searchId: search.id,
          selected: false,
          parentId: rootNode.id,
        })),
      });

      // Update the search to connect it with the root node
      const updatedSearch = await ctx.db.search.update({
        where: {
          id: search.id,
        },
        data: {
          rootNode: {
            connect: {
              id: rootNode.id,
            },
          },
        },
        include: {
          rootNode: {
            include: {
              children: true,
            },
          },
        },
      });

      return updatedSearch;
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
        rootNode: z
          .object({
            question: z.string(),
            children: z.array(
              z.object({
                question: z.string(),
              }),
            ),
          })
          .optional(),
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
            where: { rootForSearchId: input.id },
            data: {
              question: input.rootNode.question,
              children: {
                deleteMany: {},
                create: input.rootNode.children.map((child) => ({
                  question: child.question,
                  searchId: input.id,
                })),
              },
            },
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
          },
        });
      });
    }),

  // DELETE /search/node
  deleteNode: protectedProcedure
    .input(
      z.object({
        nodeId: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // First verify the node exists and get its search ID and relationships
      const node = await ctx.db.node.findUnique({
        where: { id: input.nodeId },
        include: {
          parent: true,
          children: true,
        },
      });

      if (!node) {
        throw new Error("Node not found");
      }

      // Update the parent-child relationships in a transaction
      return await ctx.db.$transaction(async (tx) => {
        // For each child node
        for (const child of node.children) {
          if (child.selected) {
            // If child is selected, update its parent to be the deleted node's parent
            await tx.node.update({
              where: { id: child.id },
              data: {
                parentId: node.parent?.id ?? null,
              },
            });
          } else {
            // If child is not selected, delete it
            await tx.node.delete({
              where: { id: child.id },
            });
          }
        }

        // Delete the node
        await tx.node.delete({
          where: { id: input.nodeId },
        });

        return { success: true };
      });
    }),

  // POST /search/node/with-children
  createNodeWithChildren: protectedProcedure
    .input(
      z.object({
        parentId: z.number(),
        query: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // First verify the parent node exists and get its search ID
      const existingNode = await ctx.db.node.findUnique({
        where: { id: input.parentId },
        select: { searchId: true },
      });

      if (!existingNode) {
        throw new Error("Parent node not found");
      }

      // Search for context
      const searchResults = await tvly.search(input.query, {
        options: {
          searchDepth: "basic",
          maxResults: 3,
        },
      });

     

      const response = await generateObject({
        model: google("gemini-1.5-flash"),
        schema: z.object({
          mainQuestion: z.string(),
          subQuestions: z.array(z.string()),
        }),
        prompt: subQuestionPrompt(input.query, searchResults),
      });

      const { mainQuestion, subQuestions } = response.object;

      // Create the new node
      const newNode = await ctx.db.node.create({
        data: {
          question: mainQuestion,
          parentId: input.parentId,
          searchId: existingNode.searchId,
          selected: false, // Child nodes are not selected by default
        },
      });

      // Create child nodes
      await ctx.db.node.createMany({
        data: subQuestions.map((question) => ({
          question: question,
          parentId: newNode.id,
          searchId: existingNode.searchId,
          selected: false, // Child nodes are not selected by default
        })),
      });

      return await ctx.db.node.findUnique({
        where: { id: newNode.id },
        include: {
          children: true,
        },
      });
    }),

  // POST /search/node/select
  selectNode: protectedProcedure
    .input(
      z.object({
        nodeId: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Fetch the node to verify it exists and get its question
      const node = await ctx.db.node.findUnique({
        where: { id: input.nodeId },
        select: { id: true, question: true, searchId: true },
      });

      if (!node) {
        throw new Error("Node not found");
      }

 
      const summaryResponse = await generateObject({
        model: google("gemini-1.5-flash"),
        schema: z.object({
          summary: z.string().max(300),
        }),
        prompt: summaryPrompt(node.question),
      });

      const subQuestionsResponse = await generateObject({
        model: google("gemini-1.5-flash"),
        schema: z.object({
          subQuestions: z.array(z.string()),
        }),
        prompt: subQuestionOnlyPrompt(node.question),
      });

      // Update the node to be selected and add summary
      await ctx.db.node.update({
        where: { id: input.nodeId },
        data: {
          selected: true,
          summary: summaryResponse.object.summary,
        },
      });

      // Create two unselected child nodes
      const subNodes = await ctx.db.node.createManyAndReturn({
        data: subQuestionsResponse.object.subQuestions.map((question) => ({
          question: question,
          parentId: input.nodeId,
          searchId: node.searchId,
          selected: false,
        })),
      });

      return {
        success: true,
        subNodes: subNodes,
        summary: summaryResponse.object.summary,
      };
    }),

  // GET /search/<id>/nodes
  getAllNodes: protectedProcedure
    .input(z.object({ searchId: z.string() }))
    .query(async ({ ctx, input }) => {
      // First verify the search exists and belongs to the user
      const search = await ctx.db.search.findUnique({
        where: {
          id: input.searchId,
          createdById: ctx.session.user.id,
        },
      });

      if (!search) {
        throw new Error("Search not found or unauthorized");
      }

      // Get all nodes for this search
      const nodes = await ctx.db.node.findMany({
        where: {
          searchId: input.searchId,
        },
        include: {
          children: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      return nodes;
    }),
});

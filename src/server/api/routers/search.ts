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

      // Generate summary for the root node
      const summaryPrompt = `Create a very short summary (max 300 characters) answering this question: "${mainQuestion}"

Requirements:
1. Be concise
2. Focus on the key point
3. Use simple language
4. Stay under 300 characters
5. Return only the summary text, no quotes or additional text

Example format:
The British Industrial Revolution negatively impacted India, transforming it into a supplier of raw materials and a market for British goods, hindering its own industrial development and causing economic exploitation.`;

      const summaryResponse = await generateObject({
        // @ts-expect-error model
        model: google("gemini-1.5-flash"),
        schema: z.object({
          summary: z.string().max(300),
        }),
        prompt: summaryPrompt,
      });

      // Create the search without root node
      const search = await ctx.db.search.create({
        data: {
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
        data: subQuestions.map(question => ({
          question: question,
          searchId: search.id,
          selected: false,
          parentId: rootNode.id
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
        rootNode: z.object({
          question: z.string(),
          children: z.array(z.object({
            question: z.string(),
          })),
        }).optional(),
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
                create: input.rootNode.children.map(child => ({
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

  // POST /search/node
  addNode: protectedProcedure
    .input(z.object({ 
      parentId: z.number(),
      question: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // First verify the parent node exists and get its search ID
      const parentNode = await ctx.db.node.findUnique({
        where: { id: input.parentId },
        select: { searchId: true },
      });

      if (!parentNode) {
        throw new Error("Parent node not found");
      }

      // Generate summary for the new node
      const summaryPrompt = `Create a very short summary (max 300 characters) answering this question: "${input.question}"

Requirements:
1. Be concise
2. Focus on the key point
3. Use simple language
4. Stay under 300 characters
5. Return only the summary text, no quotes or additional text

Example format:
The British Industrial Revolution negatively impacted India, transforming it into a supplier of raw materials and a market for British goods, hindering its own industrial development and causing economic exploitation.`;

      const summaryResponse = await generateObject({
        // @ts-expect-error model
        model: google("gemini-1.5-flash"),
        schema: z.object({
          summary: z.string().max(300),
        }),
        prompt: summaryPrompt,
      });

      // Create the new node
      return await ctx.db.node.create({
        data: {
          question: input.question,
          parentId: input.parentId,
          searchId: parentNode.searchId,
          selected: true,
          summary: summaryResponse.object.summary,
        },
        include: {
          parent: true,
        },
      });
    }),

  // DELETE /search/node
  deleteNode: protectedProcedure
    .input(z.object({ 
      nodeId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      // First verify the node exists and get its search ID
      const node = await ctx.db.node.findUnique({
        where: { id: input.nodeId },
        select: { searchId: true },
      });

      if (!node) {
        throw new Error("Node not found");
      }

      // Delete the node and all its children (cascade will handle this)
      await ctx.db.node.delete({
        where: { id: input.nodeId },
      });

      return { success: true };
    }),

  // POST /search/node/with-children
  createNodeWithChildren: protectedProcedure
    .input(z.object({ 
      parentId: z.number(),
      query: z.string(),
    }))
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
        data: subQuestions.map(question => ({
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
    .input(z.object({ 
      nodeId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Fetch the node to verify it exists and get its question
      const node = await ctx.db.node.findUnique({
        where: { id: input.nodeId },
        select: { id: true, question: true, searchId: true },
      });

      if (!node) {
        throw new Error("Node not found");
      }

      // Generate summary for the node
      const summaryPrompt = `Create a very short summary (max 300 characters) answering this question: "${node.question}"

Requirements:
1. Be concise
2. Focus on the key point
3. Use simple language
4. Stay under 300 characters
5. Return only the summary text, no quotes or additional text

Example format:
The British Industrial Revolution negatively impacted India, transforming it into a supplier of raw materials and a market for British goods, hindering its own industrial development and causing economic exploitation.`;

      const summaryResponse = await generateObject({
        // @ts-expect-error model
        model: google("gemini-1.5-flash"),
        schema: z.object({
          summary: z.string().max(300),
        }),
        prompt: summaryPrompt,
      });

      // Generate sub-questions for the node
      const structurePrompt = `Transform the topic "${node.question}" into two related sub-questions.

Requirements:
1. Sub-questions should be more specific and explore different aspects
2. All questions should be clear and concise (5-15 words)
3. Questions should encourage exploration and discussion
4. Avoid yes/no questions
5. Sub-questions should naturally follow from the main question

Example format (DO NOT copy these exact questions, create appropriate ones for the topic):
{
  "subQuestions": [
    "What were the key technological innovations that drove change?",
    "How did the Industrial Revolution affect social class structures?"
  ]
}

IMPORTANT: Return only a valid JSON object with the subQuestions field, without any additional text or explanations.`;

      const subQuestionsResponse = await generateObject({
        // @ts-expect-error model
        model: google("gemini-1.5-flash"),
        schema: z.object({
          subQuestions: z.array(z.string()),
        }),
        prompt: structurePrompt,
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
      await ctx.db.node.createMany({
        data: subQuestionsResponse.object.subQuestions.map(question => ({
          question: question,
          parentId: input.nodeId,
          searchId: node.searchId,
          selected: false,
        })),
      });

      return { success: true };
    }),
});

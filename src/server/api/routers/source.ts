import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const sourceRouter = createTRPCRouter({
  // Add a new source to a search
  add: protectedProcedure
    .input(
      z.object({
        searchId: z.number(),
        title: z.string(),
        url: z.string().url(),
        content: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify the search exists and belongs to the user
      const search = await ctx.db.search.findUnique({
        where: {
          id: input.searchId,
          createdById: ctx.session.user.id,
        },
        select: { id: true },
      });

      if (!search) {
        throw new Error("Search not found or unauthorized");
      }

      // Create the source
      return await ctx.db.source.create({
        data: {
          title: input.title,
          url: input.url,
          content: input.content,
          searchId: input.searchId,
        },
      });
    }),

  // Delete a source
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Verify the source exists and belongs to a search owned by the user
      const source = await ctx.db.source.findFirst({
        where: {
          id: input.id,
          search: {
            createdById: ctx.session.user.id,
          },
        },
        select: { id: true },
      });

      if (!source) {
        throw new Error("Source not found or unauthorized");
      }

      // Delete the source
      await ctx.db.source.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  // Get all sources for a search
  getBySearch: protectedProcedure
    .input(z.object({ searchId: z.number() }))
    .query(async ({ ctx, input }) => {
      // Verify the search exists and belongs to the user
      const search = await ctx.db.search.findUnique({
        where: {
          id: input.searchId,
          createdById: ctx.session.user.id,
        },
        select: { id: true },
      });

      if (!search) {
        throw new Error("Search not found or unauthorized");
      }

      // Get all sources for the search
      return await ctx.db.source.findMany({
        where: { searchId: input.searchId },
        orderBy: { createdAt: "desc" },
      });
    }),

  // Update a source
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().optional(),
        url: z.string().url().optional(),
        content: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify the source exists and belongs to a search owned by the user
      const source = await ctx.db.source.findFirst({
        where: {
          id: input.id,
          search: {
            createdById: ctx.session.user.id,
          },
        },
        select: { id: true },
      });

      if (!source) {
        throw new Error("Source not found or unauthorized");
      }

      // Update the source
      return await ctx.db.source.update({
        where: { id: input.id },
        data: {
          title: input.title,
          url: input.url,
          content: input.content,
        },
      });
    }),

  // Add sources to a report block
  addToReportBlock: protectedProcedure
    .input(
      z.object({
        reportBlockId: z.number(),
        sourceIds: z.array(z.number()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify the report block exists and belongs to a node in a search owned by the user
      const reportBlock = await ctx.db.reportBlock.findFirst({
        where: {
          id: input.reportBlockId,
          node: {
            search: {
              createdById: ctx.session.user.id,
            },
          },
        },
        select: { id: true },
      });

      if (!reportBlock) {
        throw new Error("Report block not found or unauthorized");
      }

      // Add the sources to the report block
      return await ctx.db.reportBlock.update({
        where: { id: input.reportBlockId },
        data: {
          sources: {
            connect: input.sourceIds.map((id) => ({ id })),
          },
        },
        include: {
          sources: true,
        },
      });
    }),

  // Remove sources from a report block
  removeFromReportBlock: protectedProcedure
    .input(
      z.object({
        reportBlockId: z.number(),
        sourceIds: z.array(z.number()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify the report block exists and belongs to a node in a search owned by the user
      const reportBlock = await ctx.db.reportBlock.findFirst({
        where: {
          id: input.reportBlockId,
          node: {
            search: {
              createdById: ctx.session.user.id,
            },
          },
        },
        select: { id: true },
      });

      if (!reportBlock) {
        throw new Error("Report block not found or unauthorized");
      }

      // Remove the sources from the report block
      return await ctx.db.reportBlock.update({
        where: { id: input.reportBlockId },
        data: {
          sources: {
            disconnect: input.sourceIds.map((id) => ({ id })),
          },
        },
        include: {
          sources: true,
        },
      });
    }),
});

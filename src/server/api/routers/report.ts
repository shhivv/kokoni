import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";

export const reportRouter = createTRPCRouter({

  create: protectedProcedure
    .input(z.object({ hierarchy: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      // return ctx.db.post.create({
      //   data: {
      //     name: input.name,
      //     createdBy: { connect: { id: ctx.session.user.id } },
      //   },
      // });
    }),
});

const { z } = require("zod");

const getPapersSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(50).default(5),
    filter: z.enum(["all", "recent", "2days"]).default("all"),
    topic_id: z.coerce.number().int().positive().optional(),
  }),
  body: z.object({}).optional(),
  params: z.object({}).optional(),
});

const getPaperByIdSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  query: z.object({}).optional(),
  body: z.object({}).optional(),
});

const searchPapersSchema = z.object({
  query: z.object({
    q: z.string().trim().min(1, "Search keyword is required"),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(50).default(10),
  }),
  body: z.object({}).optional(),
  params: z.object({}).optional(),
});


module.exports = {
  getPapersSchema,
  getPaperByIdSchema,
  searchPapersSchema,
};

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

const getRelatedPapersSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  query: z.object({
    limit: z.coerce.number().int().positive().max(20).default(5),
  }),
  body: z.object({}).optional(),
});

const getMatchingPapersSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  query: z.object({
    limit: z.coerce.number().int().positive().max(20).default(5),
  }),
  body: z.object({}).optional(),
});

const submitPaperRatingSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  body: z.object({
    rating: z.coerce
      .number()
      .int()
      .min(1, "Rating must be from 1 to 10")
      .max(10, "Rating must be from 1 to 10"),
  }),
  query: z.object({}).optional(),
});

const getMyPaperRatingSchema = z.object({
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
  getRelatedPapersSchema,
  getMatchingPapersSchema,
  submitPaperRatingSchema,
  getMyPaperRatingSchema,
  searchPapersSchema,
};

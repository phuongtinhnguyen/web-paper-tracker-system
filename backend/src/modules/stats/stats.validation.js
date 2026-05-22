const { z } = require("zod");

const getTopicTrendsSchema = z.object({
  query: z.object({
    limit: z.coerce.number().int().positive().max(50).default(10),
  }),
  params: z.object({}).optional(),
  body: z.object({}).optional(),
});

module.exports = {
  getTopicTrendsSchema,
};

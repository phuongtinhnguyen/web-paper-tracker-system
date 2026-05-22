const { z } = require("zod");

const runCrawlerSchema = z.object({
  body: z
    .object({
      topic_id: z.coerce.number().int().positive().optional(),
      max_results: z.coerce.number().int().positive().max(10).default(5),
    })
    .default({}),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

module.exports = {
  runCrawlerSchema,
};

const { z } = require("zod");

const getHistorySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(50).default(5),
    search: z.string().trim().optional(),
  }),
  params: z.object({}).optional(),
  body: z.object({}).optional(),
});

const deleteHistoryItemSchema = z.object({
  params: z.object({
    paperId: z.coerce.number().int().positive(),
  }),
  query: z.object({}).optional(),
  body: z.object({}).optional(),
});

const clearHistorySchema = z.object({
  params: z.object({}).optional(),
  query: z.object({}).optional(),
  body: z.object({}).optional(),
});

module.exports = {
  getHistorySchema,
  deleteHistoryItemSchema,
  clearHistorySchema,
};

const { z } = require("zod");

const favoritePaperSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  query: z.object({}).optional(),
  body: z.object({}).optional(),
});

const getFavoritesSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(50).default(5),
  }),
  params: z.object({}).optional(),
  body: z.object({}).optional(),
});

module.exports = {
  favoritePaperSchema,
  getFavoritesSchema,
};

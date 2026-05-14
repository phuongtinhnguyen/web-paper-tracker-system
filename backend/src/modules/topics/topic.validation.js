const { z } = require("zod");

const topicBodySchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(1, "Topic name is required")
      .max(100, "Topic name must be at most 100 characters"),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

const topicParamsSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({
    id: z.coerce.number().int().positive("Topic id must be a positive integer"),
  }),
});

const updateTopicSchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(1, "Topic name is required")
      .max(100, "Topic name must be at most 100 characters"),
  }),
  query: z.object({}).optional(),
  params: z.object({
    id: z.coerce.number().int().positive("Topic id must be a positive integer"),
  }),
});

module.exports = {
  topicBodySchema,
  topicParamsSchema,
  updateTopicSchema,
};

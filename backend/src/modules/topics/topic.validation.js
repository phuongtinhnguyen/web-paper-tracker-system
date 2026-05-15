const { z } = require("zod");

const followTopicBodySchema = z.object({
  body: z.object({
    topic_id: z.coerce
      .number()
      .int()
      .positive("Topic id must be a positive integer"),
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

const updateUserTopicSchema = z.object({
  body: z.object({
    topic_id: z.coerce
      .number()
      .int()
      .positive("Topic id must be a positive integer"),
  }),
  query: z.object({}).optional(),
  params: z.object({
    id: z.coerce.number().int().positive("Topic id must be a positive integer"),
  }),
});

module.exports = {
  followTopicBodySchema,
  topicParamsSchema,
  updateUserTopicSchema,
};

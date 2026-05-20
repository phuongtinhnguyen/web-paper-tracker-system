const { z } = require("zod");

const pushNotificationsSchema = z.object({
  body: z.object({
    event: z.string().trim().default("NEW_NOTIFICATION"),
    notification_ids: z.array(z.coerce.number().int().positive()).default([]),
    notification_count: z.coerce.number().int().nonnegative().optional(),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

module.exports = {
  pushNotificationsSchema,
};

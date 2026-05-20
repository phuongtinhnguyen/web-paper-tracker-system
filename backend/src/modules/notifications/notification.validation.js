const { z } = require("zod");

const booleanQuery = z.preprocess((value) => {
  if (value === undefined) return undefined;
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  return value;
}, z.boolean().optional());

const getNotificationsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(50).default(10),
    unread_only: booleanQuery.default(false),
  }),
  params: z.object({}).optional(),
  body: z.object({}).optional(),
});

const notificationIdSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  query: z.object({}).optional(),
  body: z.object({}).optional(),
});

module.exports = {
  getNotificationsSchema,
  notificationIdSchema,
};

const { z } = require("zod");

const registerSchema = z.object({
  body: z.object({
    username: z.string().min(1, "Username is required"),
    email: z.string().email("Email is invalid"),
    password: z.string().min(6, "Password must be at least 6 characters"),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Email is invalid"),
    password: z.string().min(1, "Password is required"),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

module.exports = {
  registerSchema,
  loginSchema,
};

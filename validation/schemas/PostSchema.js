const { z } = require('zod')

const StorePostSchema = z.object({
  text: z.string({ required_error: "Post message is required" }).min(1, { message: "Post message is required" }),
  user_id: z.string()
});

const UpdatePostSchema = z.object({
  text: z.string({ required_error: "Post message is required" }).min(1, { message: "Post message is required" }),
  user_id: z.string()
});

module.exports = { StorePostSchema, UpdatePostSchema }
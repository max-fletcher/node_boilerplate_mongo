const { z } = require('zod')

const StorePostSchema = z.object({
  text: z.string(),
  user_id: z.string()
});

const GetPostSchema = z.object({
  id: z.string()
});

const UpdatePostSchema = z.object({
  text: z.string(),
  user_id: z.string()
});

module.exports = { StorePostSchema, UpdatePostSchema, GetPostSchema }
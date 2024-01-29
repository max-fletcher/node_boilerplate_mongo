const { z } = require('zod')

const StoreCommentSchema = z.object({
  text: z.string({ required_error: "Comment message is required" }).min(1, { message: "Comment message is required" }),
  post_id: z.string()
});

const UpdateCommentSchema = z.object({
  text: z.string({ required_error: "Comment message is required" }).min(1, { message: "Comment message is required" }),
  post_id: z.string()
});

module.exports = { StoreCommentSchema, UpdateCommentSchema }
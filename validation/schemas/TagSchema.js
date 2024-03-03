const { z } = require('zod')

const StoreTagSchema = z.object({
  text: z.string({ required_error: "Tag message is required" }).min(1, { message: "Tag message is required" }),
  post_id: z.array(z.string())
});

const UpdateTagSchema = z.object({
  text: z.string({ required_error: "Tag message is required" }).min(1, { message: "Tag message is required" }),
  post_id: z.array(z.string())
});

module.exports = { StoreTagSchema, UpdateTagSchema }
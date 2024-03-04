const { z } = require('zod')

const StoreTagSchema = z.object({
  text: z.string({ required_error: "Tag message is required" }).min(1, { message: "Tag message is required" }),
  // post_id: z.string({ required_error: "Post ids is required" }).array() // Another way to write the line below
  post_id: z.array(z.string(), { required_error: "Post ids is required" })
});

const UpdateTagSchema = z.object({
  text: z.string({ required_error: "Tag message is required" }).min(1, { message: "Tag message is required" }),
  // post_id: z.string({ required_error: "Post ids is required" }).array() // Another way to write the line below
  post_id: z.array(z.string(), { required_error: "Post ids is required" })
});

module.exports = { StoreTagSchema, UpdateTagSchema }
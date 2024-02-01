const { z } = require('zod')

const StorePostSchema = z.object({
  text: z.string({ required_error: "Post message is required" }).min(10, { message: "Post message is required" }).max(2, { message: "Yolo" }),
  user_id: z.string(),
  file: z.object({
    fieldname: z.string(),
    originalname: z.union([z.string().endsWith('.jpg'), z.string().endsWith('.png'), z.string().endsWith('.jpeg'), z.string().endsWith('.webp')]),
    mimetype: z.union([z.string().endsWith('.jpg'), z.string().endsWith('.jpeg'), z.string().endsWith('.png'), z.string().endsWith('.webp')]),
    destination: z.union([z.string().includes('image/jpg'), z.string().includes('image/jpeg'), z.string().includes('image/png'), z.string().includes('image/webp')]),
    filename: z.string(),
    path: z.string(),
    size: z.number().max(30000, { message: "File size must be less than 30KB" }),
  })
});

const UpdatePostSchema = z.object({
  text: z.string({ required_error: "Post message is required" }).min(1, { message: "Post message is required" }),
  user_id: z.string()
});

module.exports = { StorePostSchema, UpdatePostSchema }
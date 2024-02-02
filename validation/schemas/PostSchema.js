const { z } = require('zod')

const StorePostSchema = z.object({
  text: z.string({ required_error: "Post message is required" }).min(10, { message: "Bitch MF" }).max(2, { message: "Yolo" }),
  user_id: z.string(),
  file: z.object({
    fieldname: z.string(),
    originalname: z.union([
      z.string().endsWith('.jpg', { message: "File type must be jpg, jpeg, png or webp" }),
      z.string().endsWith('.jpeg', { message: "File type must be jpg, jpeg, png or webp" }),
      z.string().endsWith('.png', { message: "File type must be jpg, jpeg, png or webp" }),
      z.string().endsWith('.webp', { message: "File type must be jpg, jpeg, png or webp" })
    ]),
    mimetype: z.union([
      z.string().includes('image/jpg', { message: "File type must be jpg, jpeg, png or webp" }), 
      z.string().includes('image/jpeg', { message: "File type must be jpg, jpeg, png or webp" }), 
      z.string().includes('image/png', { message: "File type must be jpg, jpeg, png or webp" }), 
      z.string().includes('image/webp', { message: "File type must be jpg, jpeg, png or webp" })
    ]),
    destination: z.string(),
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
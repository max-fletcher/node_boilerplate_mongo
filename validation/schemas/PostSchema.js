const { z } = require('zod')

const imageValidationRule = z.object({
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
  size: z.number().max(5242880, { message: "File size must be less than 5MB" }),
})

const multiImageValidationRule = z.array(imageValidationRule)

const StorePostSchema = z.object({
  text: z.string({ required_error: "Post message is required" }).min(1, { message: "Post message is required" }),
  user_id: z.string({ required_error: "User ID is required" }),
  file: imageValidationRule
});

const StorePostMultipleImageSchema = z.object({
  text: z.string({ required_error: "Post message is required" }).min(1, { message: "Post message is required" }),
  user_id: z.string({ required_error: "User ID is required" }),
  files: z.object({
    images1: multiImageValidationRule,
    images2: multiImageValidationRule
  })
});

const UpdatePostSchema = z.object({
  text: z.string({ required_error: "Post message is required" }).min(1, { message: "Post message is required" }),
  user_id: z.string({ required_error: "User ID is required" }),
  file: imageValidationRule
});

const UpdatePostMultipleImageSchema = z.object({
  text: z.string({ required_error: "Post message is required" }).min(1, { message: "Post message is required" }),
  user_id: z.string({ required_error: "User ID is required" }),
  files: z.object({
    images1: multiImageValidationRule,
    images2: multiImageValidationRule
  })
});

module.exports = { StorePostSchema, StorePostMultipleImageSchema, UpdatePostSchema, UpdatePostMultipleImageSchema }
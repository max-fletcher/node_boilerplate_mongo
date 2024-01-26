const { z } = require('zod')

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

module.exports = { LoginSchema, RegisterSchema }
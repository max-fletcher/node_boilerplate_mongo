const setRateLimit = require("express-rate-limit");

// For routes that are protected by auth middleware
const authRatelimitMiddleware = setRateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: "You have exceeded your 60 requests per minute limit.",
  headers: true,
});

// For routes that are not protected by auth middleware
const publicRatelimitMiddleware = setRateLimit({
  windowMs: 60 * 1000,
  max: 200,
  message: "You have exceeded your 200 requests per minute limit.",
  headers: true,
});

// If you don't want to use route specific rate limiter(see server.js)
const globalRatelimitMiddleware = setRateLimit({
  windowMs: 60 * 1000,
  max: 200,
  message: "You have exceeded your 200 requests per minute limit.",
  headers: true,
});

module.exports = { authRatelimitMiddleware, publicRatelimitMiddleware, globalRatelimitMiddleware };
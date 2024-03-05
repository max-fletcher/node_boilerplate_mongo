require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');
const cors = require('cors');
const corsOptions = require('./config/corsOptions');
const { logger } = require('./middleware/logEvents');
const errorHandler = require('./middleware/errorHandler');
const verifyJWT = require('./middleware/verifyJWT');
const verifySimpleJWT = require('./middleware/verifySimpleJWT');
const cookieParser = require('cookie-parser');
const credentials = require('./middleware/credentials');
const mongoose = require('mongoose');
const connectDB = require('./config/dbConn');
const { authRatelimitMiddleware, publicRatelimitMiddleware, globalRatelimitMiddleware } = require('./middleware/ratelimit');
const PORT = process.env.PORT || 3500;
// routes
const simpleJWTAuthRoutes = require('./routes/simple-jwt-auth')
const employeeRoutes = require('./routes/api/employees')
const userRoutes = require('./routes/api/users')
const postRoutes = require('./routes/api/posts')
const commentRoutes = require('./routes/api/comments')
const tagRoutes = require('./routes/api/tags')


// Connect to MongoDB
connectDB();

// custom middleware logger
app.use(logger);

// Handle options credentials check - before CORS!
// and fetch cookies credentials requirement
app.use(credentials);

// Cross Origin Resource Sharing
app.use(cors(corsOptions));

// built-in middleware to handle urlencoded form data
app.use(express.urlencoded({ extended: false }));

// built-in middleware for json
app.use(express.json());

//middleware for cookies
app.use(cookieParser());

// If you don't want to use route specific rate limiter and instead want a global rate limiter instead middleware
// app.use(globalRatelimitMiddleware)

//serve static files
app.use('/', express.static(path.join(__dirname, '/public')));

// routes
app.use('/', require('./routes/root'));
app.use('/api/v1/register', publicRatelimitMiddleware, require('./routes/register'));
app.use('/api/v1/auth', publicRatelimitMiddleware, require('./routes/auth'));
app.use('/api/v1/refresh', publicRatelimitMiddleware, require('./routes/refresh'));
app.use('/api/v1/logout', publicRatelimitMiddleware, require('./routes/logout'));

// USING SIMPLE JWT AUTH. REMEMBER TO COMMENT THE ROUTES BELOW THESE TO AVOID ROUTE DUPLICATION/ROUTE CONFLICT
app.use('/api/v1/simple-jwt-auth', publicRatelimitMiddleware, simpleJWTAuthRoutes)
app.use('/api/v1/employees', authRatelimitMiddleware, verifySimpleJWT, employeeRoutes)
app.use('/api/v1/users', authRatelimitMiddleware, verifySimpleJWT, userRoutes)
app.use('/api/v1/posts', authRatelimitMiddleware, verifySimpleJWT, postRoutes)
app.use('/api/v1/comments', authRatelimitMiddleware, verifySimpleJWT, commentRoutes)
app.use('/api/v1/tags', authRatelimitMiddleware, verifySimpleJWT, tagRoutes)

// app.use(verifyJWT) //IF YOU WANT TO APPLY MIDDLEWARE TO THE ROUTES BELOW
// app.use('/api/v1/employees', require('./routes/api/employees'));
// app.use('/api/v1/users', require('./routes/api/users'));

app.all('*', (req, res) => {
  res.status(404);
  if (req.accepts('html')) {
      res.sendFile(path.join(__dirname, 'views', '404.html'));
  } else if (req.accepts('json')) {
      res.json({ "error": "404 Not Found" });
  } else {
      res.type('txt').send("404 Not Found");
  }
});

app.use(errorHandler);

mongoose.connection.once('open', () => {
  console.log('Connected to MongoDB');
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});

// const expressListRoutes = require('express-list-routes');
// expressListRoutes(app, { prefix: '/' });
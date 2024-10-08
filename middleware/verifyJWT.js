const jwt = require('jsonwebtoken');

const verifyJWT = (req, res, next) => {
    try {
      const authHeader = req.headers.authorization || req.headers.Authorization;
      if (!authHeader?.startsWith('Bearer ')) return res.sendStatus(401);
      const token = authHeader.split(' ')[1];
      console.log(token)
      jwt.verify(
          token,
          process.env.ACCESS_TOKEN_SECRET,
          (err, decoded) => {
              if (err) return res.sendStatus(403); //invalid token
              req.user = decoded.UserInfo.email;
              // req.roles = decoded.UserInfo.roles;
              next();
          }
      );
    } catch (error) {
      return res.status(500).json({ message: 'Something went wrong! Please try again.' })
    }
}

module.exports = verifyJWT
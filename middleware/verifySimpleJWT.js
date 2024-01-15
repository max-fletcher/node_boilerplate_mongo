const jwt = require('jsonwebtoken');

const verifySimpleJWT = (req, res, next) => {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    const cookies = req.cookies;
    const simpleJWTToken = cookies.simple_login_jwt

    // console.log('authHeader', authHeader, 'all_cookies', cookies, 'simple_jwt', simpleJWTToken, 'again', cookies.simple_login_jwt);

    if(authHeader || simpleJWTToken){
      if (!authHeader?.startsWith('Bearer ')) return res.sendStatus(401);
      const token = simpleJWTToken ? simpleJWTToken : authHeader.split(' ')[1];
      // console.log(token)
      jwt.verify(
          token,
          process.env.ACCESS_TOKEN_SECRET,
          (error, decoded) => {
              if (error)
                return res.sendStatus(403); //invalid token
              req.user = decoded.UserInfo.username;
              next();
          }
      );
    }
}

module.exports = verifySimpleJWT
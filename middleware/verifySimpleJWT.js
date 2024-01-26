const jwt = require('jsonwebtoken');
const User = require('../models/User');

const verifySimpleJWT = (req, res, next) => {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    const cookies = req.cookies;
    const simpleJWTToken = cookies.simple_jwt

    // console.log('authHeader', authHeader, 'all_cookies', cookies, 'simple_jwt', simpleJWTToken, 'again', cookies.simple_jwt);

    try {
      if(authHeader || simpleJWTToken){
        console.log(simpleJWTToken);
        if (authHeader && !authHeader?.startsWith('Bearer ')) return res.sendStatus(401);
        const token = simpleJWTToken ? simpleJWTToken : authHeader.split(' ')[1];
        if (!token) return res.sendStatus(401);
        // console.log(token)
        jwt.verify(
            token,
            process.env.ACCESS_TOKEN_SECRET,
            async (error, decoded) => {
                if (error)
                  return res.sendStatus(403); //invalid token
                req.user = decoded.UserInfo.email
                const user = await User.findOne({ email: decoded.UserInfo.email }).exec()
                if(!user){
                  res.clearCookie('simple_jwt', { httpOnly: true, sameSite: 'None', secure: true })
                  return res.sendStatus(403); //invalid token
                }
                next();
            }
        );
      }
    } catch (error) {
      console.log(error);
      res.clearCookie('simple_jwt', { httpOnly: true, sameSite: 'None', secure: true });
      return res.sendStatus(403); //invalid token
    }
}

module.exports = verifySimpleJWT
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { simpleJWTLoginTokenDuration } = require('../enums/tokenDurations');

const simpleJWTRegister = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ 'message': 'Username and password are required.' });


  // check for duplicate usernames in the db
  const duplicate = await User.findOne({ username: username }).exec();
  if (duplicate) return res.sendStatus(409); //Conflict 

  try {
      //encrypt the password
      const hashedPwd = await bcrypt.hash(password, 10);

    // create JWTs
    const simpleJWTLoginToken = jwt.sign(
        {
            "UserInfo": {
                "username": username,
            }
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: simpleJWTLoginTokenDuration }
    );

      //create and store the new user
      const result = await User.create({
          "username": username,
          "password": hashedPwd,
          "simpleJWTLoginToken": simpleJWTLoginToken
      });

      console.log(result);

      // Creates Secure Cookie with refresh token
      res.cookie('simple_jwt_login', simpleJWTLoginToken, { httpOnly: true, secure: true, sameSite: 'None', maxAge: 24 * 60 * 60 * 1000 });

      res.status(201).json({ message: `Registration for ${username} successful!`, simpleJWTLoginToken : simpleJWTLoginToken });
  } catch (err) {
      res.status(500).json({ 'message': err.message });
  }
}

const simpleJWTLogin = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ 'message': 'Username and password are required.' });

  const foundUser = await User.findOne({ username: username }).exec();
  if (!foundUser) return res.sendStatus(401); //Unauthorized
  // evaluate password 
  const match = await bcrypt.compare(password, foundUser.password);

  if (match) {
      // create JWTs
      const simpleJWTLoginToken = jwt.sign(
          {
              "UserInfo": {
                  "username": foundUser.username,
              }
          },
          process.env.ACCESS_TOKEN_SECRET,
          { expiresIn: simpleJWTLoginTokenDuration }
      );

      foundUser.simpleJWTLoginToken = simpleJWTLoginToken
      const result = await foundUser.save();
      console.log(result);

      // Creates Secure Cookie with refresh token
      res.cookie('simple_login_jwt', simpleJWTLoginToken, { httpOnly: true, secure: true, sameSite: 'None', maxAge: 24 * 60 * 60 * 1000 });

      res.json({ simpleJWTLoginToken });

  } else {
      res.sendStatus(401);
  }
}

module.exports = { simpleJWTRegister, simpleJWTLogin };
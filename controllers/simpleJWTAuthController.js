const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { simpleJWTLoginTokenDuration } = require('../enums/tokenDurations');

const simpleJWTRegister = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ 'message': 'Email and password are required.' });


  // check for duplicate usernames in the db
  const duplicate = await User.findOne({ email: email }).exec();
  if (duplicate) return res.sendStatus(409); //Conflict 

  try {
      //encrypt the password
      const hashedPwd = await bcrypt.hash(password, 10);

    // create JWTs
    const simpleJWTLoginToken = jwt.sign(
        {
            "UserInfo": {
                "email": email,
            }
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: simpleJWTLoginTokenDuration }
    );

      //create and store the new user
      const result = await User.create({
          "email": email,
          "password": hashedPwd,
          "simpleJWTLoginToken": simpleJWTLoginToken
      });

      console.log(result);

      // Creates Secure Cookie with refresh token
      res.cookie('simple_jwt', simpleJWTLoginToken, { httpOnly: true, secure: true, sameSite: 'None', maxAge: 24 * 60 * 60 * 1000 });

      res.status(201).json({ message: `Registration for ${email} successful!`, simpleJWTLoginToken : simpleJWTLoginToken });
  } catch (err) {
      res.status(500).json({ 'message': err.message });
  }
}

const simpleJWTLogin = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ 'message': 'Email and password are required.' });

  const foundUser = await User.findOne({ email: email }).exec();
  if (!foundUser) return res.sendStatus(401); //Unauthorized
  // evaluate password 
  const match = await bcrypt.compare(password, foundUser.password);

  if (match) {
      // create JWTs
      const simpleJWTLoginToken = jwt.sign(
          {
              "UserInfo": {
                  "email": foundUser.email,
              }
          },
          process.env.ACCESS_TOKEN_SECRET,
          { expiresIn: simpleJWTLoginTokenDuration }
      );

      foundUser.simpleJWTLoginToken = simpleJWTLoginToken
      const result = await foundUser.save();
      console.log(result);

      // Creates Secure Cookie with refresh token
      res.cookie('simple_jwt', simpleJWTLoginToken, { httpOnly: true, secure: true, sameSite: 'None', maxAge: 24 * 60 * 60 * 1000 });

      res.json({ simpleJWTLoginToken });

  } else {
      res.sendStatus(401);
  }
}

const getAuthUser = async (req, res) => {
  const cookies = req.cookies;
  if (!cookies?.simple_jwt) return res.sendStatus(204); //No content
  const simpleJWTLoginToken = cookies.simple_jwt;

  const foundUser = await User.findOne({ simpleJWTLoginToken }).exec();
  console.log(foundUser);
  if (!foundUser) {
    res.clearCookie('simple_jwt', { httpOnly: true, sameSite: 'None', secure: true });
    return res.sendStatus(204);
  }

  res.status(200).json({ message: foundUser });
}

const simpleJWTLogout = async (req, res) => {
    const cookies = req.cookies;
    if (!cookies?.simple_jwt) return res.sendStatus(204); //No content
    const simpleJWTLoginToken = cookies.simple_jwt;

  const foundUser = await User.findOne({ simpleJWTLoginToken }).exec();
  if (!foundUser) {
    res.clearCookie('simple_jwt', { httpOnly: true, sameSite: 'None', secure: true });
    return res.sendStatus(204);
  }

  foundUser.simpleJWTLoginToken = null;
  const result = await foundUser.save();
  console.log(result);

  res.clearCookie('simple_jwt', { httpOnly: true, sameSite: 'None', secure: true });
  res.sendStatus(204);
}

module.exports = { simpleJWTRegister, simpleJWTLogin, simpleJWTLogout, getAuthUser };
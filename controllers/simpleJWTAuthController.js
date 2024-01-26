const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { simpleJWTLoginTokenDuration } = require('../enums/tokenDurations');
const { ZodError } = require('zod');
const LoginSchema = require('../validation/schemas/LoginSchema');
const NotFoundException = require('../exceptions/NotFoundExceptions');
const CustomException = require('../exceptions/CustomException');

const simpleJWTRegister = async (req, res) => {
  try {
    // VALIDATION
    const validatedData = LoginSchema.parse(req.body);

    // check for duplicate emails in the db
    const duplicate = await User.findOne({ email: validatedData.email }).exec();
    if (duplicate) throw new CustomException('User with this email already exists.', 409) //Conflict

    //encrypt the password
    const hashedPwd = await bcrypt.hash(validatedData.password, 10);

    // create JWTs
    const simpleJWTLoginToken = jwt.sign(
        {
            "UserInfo": {
                "email": validatedData.email,
            }
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: simpleJWTLoginTokenDuration }
    );

    //create and store the new user
    const result = await User.create({
        "email": validatedData.email,
        "password": hashedPwd,
        "simpleJWTLoginToken": simpleJWTLoginToken
    });

    console.log(result);

    // Creates Secure Cookie with refresh token
    res.cookie('simple_jwt', simpleJWTLoginToken, { httpOnly: true, secure: true, sameSite: 'None', maxAge: 24 * 60 * 60 * 1000 });

    res.status(201).json({ message: `Registration for ${validatedData.email} successful!`, simpleJWTLoginToken : simpleJWTLoginToken });
  } catch (error) {
    console.log(error);
    if(error instanceof ZodError){
      return res.status(422).json({ type: 'validation', error : error.format()})
    }
    else if(error instanceof CustomException){
      return res.status(error.status).json({ type: 'exception', error : error.message })
    }
    else{
      return res.status(500).json({ type: 'exception', error : 'Something went wrong! Please try again.'})
    }
  }
}

const simpleJWTLogin = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ 'message': 'Email and password are required.' });

  const foundUser = await User.findOne({ email: email }).exec();
  if (!foundUser) return res.send(404).json({ message: 'User not found.' }); //NOT FOUND
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
  if (!cookies?.simple_jwt) return res.sendStatus(404); //No content
  const simpleJWTLoginToken = cookies.simple_jwt;

  const foundUser = await User.findOne({ simpleJWTLoginToken }).exec();
  console.log(foundUser);
  if (!foundUser) {
    res.clearCookie('simple_jwt', { httpOnly: true, sameSite: 'None', secure: true });
    return res.status(404).json({ message : `Unauthenticated` });
  }

  res.status(200).json({ message: foundUser });
}

const simpleJWTLogout = async (req, res) => {
    const cookies = req.cookies;
    if (!cookies?.simple_jwt) return res.sendStatus(404); //No content
    const simpleJWTLoginToken = cookies.simple_jwt;

  const foundUser = await User.findOne({ simpleJWTLoginToken }).exec();
  if (!foundUser) {
    res.clearCookie('simple_jwt', { httpOnly: true, sameSite: 'None', secure: true });
    return res.status(404).json({ message : `Unauthenticated` });
  }

  foundUser.simpleJWTLoginToken = null;
  const result = await foundUser.save();
  console.log(result);

  res.clearCookie('simple_jwt', { httpOnly: true, sameSite: 'None', secure: true });
  res.status(200).json({ message : `Logged out sccessfully` });
}

module.exports = { simpleJWTRegister, simpleJWTLogin, simpleJWTLogout, getAuthUser };
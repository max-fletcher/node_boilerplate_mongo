const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { accessTokenDuration, refreshTokenDuration } = require('../enums/tokenDurations');

const handleNewUser = async (req, res) => {
    const { username, password } = req.body;
    console.log(req.body, username, password);
    if (!username || !password) return res.status(400).json({ 'message': 'Username and password are required.' });

    // check for duplicate usernames in the db
    const duplicate = await User.findOne({ username: username }).exec();
    if (duplicate) return res.sendStatus(409); //Conflict 

    try {
        //encrypt the password
        const hashedPwd = await bcrypt.hash(password, 10);

      // create JWTs
      const accessToken = jwt.sign(
          {
              "UserInfo": {
                  "username": username,
                  // "roles": roles
              }
          },
          process.env.ACCESS_TOKEN_SECRET,
          { expiresIn: accessTokenDuration }
      );
      const newRefreshToken = jwt.sign(
          { "username": username },
          process.env.REFRESH_TOKEN_SECRET,
          { expiresIn: refreshTokenDuration }
      );

      const refreshTokenArray = [newRefreshToken];




        //create and store the new user
        const result = await User.create({
            "username": username,
            "password": hashedPwd,
            "refreshToken": refreshTokenArray
        });

        console.log(result);

        res.cookie('jwt', newRefreshToken, { httpOnly: true, secure: true, sameSite: 'None', maxAge: 24 * 60 * 60 * 1000 });

        res.status(201).json({ message: `Registration for ${username} successful!`, accessToken : accessToken });
    } catch (err) {
        res.status(500).json({ 'message': err.message });
    }
}

module.exports = { handleNewUser };
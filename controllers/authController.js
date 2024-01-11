const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { accessTokenDuration, refreshTokenDuration } = require('../enums/tokenDurations');

const handleLogin = async (req, res) => {
    const cookies = req.cookies;
    console.log(`cookie available at login: ${JSON.stringify(cookies)}`);
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ 'message': 'Username and password are required.' });

    const foundUser = await User.findOne({ username: username }).exec();
    if (!foundUser) return res.sendStatus(401); //Unauthorized
    // evaluate password 
    const match = await bcrypt.compare(password, foundUser.password);
    if (match) {
        // const roles = Object.values(foundUser.roles).filter(Boolean);
        // create JWTs
        const accessToken = jwt.sign(
            {
                "UserInfo": {
                    "username": foundUser.username,
                    // "roles": roles
                }
            },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: accessTokenDuration }
        );
        const newRefreshToken = jwt.sign(
            { "username": foundUser.username },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: refreshTokenDuration }
        );

        // Changed to let keyword
        // IF JWT DOESN'T EXIST IN THE REQUEST COOKIE, PRESERVE/SAVE ALL COOKIES IN newRefreshTokenArray, ELSE(I.E JWT EXISTS IN THE REQUEST COOKIE), 
        // PRESERVE/SAVE ALL COOKIES EXCEPT THAT IN newRefreshTokenArray
        let newRefreshTokenArray =
            !cookies?.jwt
                ? foundUser.refreshToken
                : foundUser.refreshToken.filter(rt => rt !== cookies.jwt);

        if (cookies?.jwt) {

            /* 
            Scenario added here: 
                1) User logs in but never uses RT and does not logout 
                2) RT is stolen
                3) If 1 & 2, reuse detection is needed to clear all RTs when username logs in
            */
            const refreshToken = cookies.jwt;
            const foundToken = await User.findOne({ refreshToken }).exec();

            // Detected refresh token reuse!
            if (!foundToken) {
                console.log('attempted refresh token reuse at login!')
                // clear out ALL previous refresh tokens
                newRefreshTokenArray = [];
            }

            res.clearCookie('jwt', { httpOnly: true, sameSite: 'None', secure: true });
        }

        // Saving refreshToken with current username
        foundUser.refreshToken = [...newRefreshTokenArray, newRefreshToken];
        const result = await foundUser.save();
        console.log(result);
        // console.log(roles);

        // Creates Secure Cookie with refresh token
        res.cookie('jwt', newRefreshToken, { httpOnly: true, secure: true, sameSite: 'None', maxAge: 24 * 60 * 60 * 1000 });

        // Send authorization roles and access token to username
        // res.json({ roles, accessToken }); // Removed roles(lesson 7)since it is already in the accessToken
        res.json({ accessToken });

    } else {
        res.sendStatus(401);
    }
}

module.exports = { handleLogin };
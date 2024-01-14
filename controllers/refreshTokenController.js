const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { accessTokenDuration, refreshTokenDuration } = require('../enums/tokenDurations');

const handleRefreshToken = async (req, res) => {
    const cookies = req.cookies;
    if (!cookies?.jwt) return res.sendStatus(401);
    const refreshToken = cookies.jwt;
    // CLEAR COOKIE BECAUSE WE ARE GONNA SERVE A NEW COOKIE
    res.clearCookie('jwt', { httpOnly: true, sameSite: 'None', secure: true });

    const foundUser = await User.findOne({ refreshToken }).exec();

    // Detected refresh token reuse!
    // WHEN A JWT HAS A USER'S username BUT IS NOT INSIDE THE ARRAY IN HIS DATABASE RECORD, WE EMPTY ALL REFRESH
    // TOKENS INSIDE THAT USER'S TOKENS ARRAY. AFTER THAT, IT RETURN A 403 STATUS CODE AS RESPONSE
    if (!foundUser) {
        jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET,
            async (err, decoded) => {
                if (err) return res.sendStatus(403); //Forbidden // IF THERE IS AN ERROR IN DECODING THE JWT
                console.log('attempted refresh token reuse!')
                const hackedUser = await User.findOne({ username: decoded.username }).exec();
                if(hackedUser){
                  console.log(hackedUser);
                  hackedUser.refreshToken = [];
                  const result = await hackedUser.save();
                }
                console.log(result);
            }
        )
        return res.sendStatus(403); //Forbidden
    }

    // GET ALL REFRESH TOKENS EXCEPT THE ONE WE GOT IN THIS REQUEST
    const newRefreshTokenArray = foundUser.refreshToken.filter(rt => rt !== refreshToken);

    // evaluate jwt 
    // SEE IF THE REFRESH TOKEN WE GOT IN THIS REQUEST IS VALID OR NOT. BASED ON IF IT IS VALID OR NOT, WE CAN GENERATE THE APPROPRIATE RESPONSE
    jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
        async (err, decoded) => {
            if (err) { // IF REFRESH TOKEN IS EXPIRED OR CANNOT BE DECODED BECAUSE ITS ENCODING IS WRONG OR SOMETHING
                console.log('expired refresh token')
                foundUser.refreshToken = [...newRefreshTokenArray]; // PUSH AND SAVE ALL REFRESH TOKENS EXCEPT THE ONE WE GOT IN THIS REQUEST
                const result = await foundUser.save();
                console.log(result);
            }
            // IF REFRESH TOKEN DOESN'T BELONG TO THE foundUser. HENCE foundUser's username IS NOT THE SAME AS DECODED username
            if (err || foundUser.username !== decoded.username) return res.sendStatus(403);

            // Refresh token was still valid
            // IF ALL OTHER IF CONDITIONS ABOVE ARE NOT VISITED, MEANS ITS A VALID REFRESH TOKEN. HENCE THE CODE BELOW WILL WORK.
            // const roles = Object.values(foundUser.roles);
            const accessToken = jwt.sign(
                {
                    "UserInfo": {
                        "username": decoded.username,
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
            // Saving refreshToken with current user
            foundUser.refreshToken = [...newRefreshTokenArray, newRefreshToken];
            const result = await foundUser.save();

            // Creates Secure Cookie with refresh token
            res.cookie('jwt', newRefreshToken, { httpOnly: true, secure: true, sameSite: 'None', maxAge: 24 * 60 * 60 * 1000 });

            // res.json({ roles, accessToken })
            res.json({ accessToken })
        }
    );
}

module.exports = { handleRefreshToken }
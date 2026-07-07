const jwt = require('jsonwebtoken');

const config = require('../config/index');

const generateToken = (payload) => {
    return jwt.sign(
        payload,
        config.JWT_SECRET, 
        {
            expiresIn: config.JWT_EXPIRES_IN
        });
}

module.exports = generateToken;

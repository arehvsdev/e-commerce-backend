const jwt = require('jsonwebtoken');
const config = require('../config/index');

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
console.log("Authorization header:", authHeader)
    if( !authHeader || !authHeader.startsWith('Bearer ')){
        return res.status(401).json({
          error: "Access denied. No token provided.",
        });
    }
    const token = authHeader.split(' ')[1];
    try {
        console.log({
            token, 
            "config.JWT_SECRET": config.JWT_SECRET
        });
        
        const decoded = jwt.verify(token, config.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        console.log("errr ",error);
        return res.status(401).json({
          error: "Invalid or expired token.",
        });
    }
}

module.exports = authMiddleware;
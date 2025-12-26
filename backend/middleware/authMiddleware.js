

const jwt = require("jsonwebtoken");
const response = require("../utils/responsehandler");

const authMiddleware = (req, res, next) => {
    // Check for token in Authorization header first
    const authHeader = req.headers.authorization;
    let token;

    if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
    } 
    // If no Authorization header, check for token in cookies
    else if (req.cookies && req.cookies.authToken) {
        token = req.cookies.authToken;
    }

    if (!token) {
        return response(res, 401, "Authorization token missing. Please provide token");
    }

  

    try {
        const decode = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decode;
        req.userId = decode.userId || decode.id || decode._id;
        next();
    } catch (error) {
        return response(res, 401, "Invalid or expired token");
    }
};

module.exports = authMiddleware;

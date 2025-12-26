

const jwt = require("jsonwebtoken");
const response = require("../utils/responsehandler");

const socketMiddleware = (socket, next) => {
    // Extract token from handshake (auth, headers, or cookies)
    const token = socket.handshake.auth?.token || 
                  socket.handshake.headers?.cookie?.split('authToken=')[1]?.split(';')[0];

    if (!token) {
        console.warn("⚠️ Socket connection without auth token");
        return next(new Error("Authentication token missing"));
    }

    try {
        const decode = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = decode;
        socket.userId = decode.userId || decode.id || decode._id;
        console.log("✅ Socket authenticated for user:", socket.userId);
        next();
    } catch (error) {
        console.error("❌ Socket auth failed:", error.message);
        return next(new Error("Invalid or expired token"));
    }
};

module.exports = socketMiddleware;
// auth middleware
const jwt = require('jsonwebtoken');

// Authentication middleware
const authMiddleware = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', ''); // Extract token from header
    // if (!token) {
    //     return res.status(401).json({ message: 'No token provided, authorization denied' });
    // }

    try {
        // Verify the token and extract payload
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = { _id: decoded.userId };  // Set the user ID in req.user
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};

module.exports = authMiddleware;

const jwt = require('jsonwebtoken');

// Middleware to authenticate user and attach user data to req.user
const authenticateUser = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).send({ message: 'Authorization header missing or malformed.' });
    }

    const token = authHeader.split(' ')[1]; // Extract the token after "Bearer"
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // Replace 'your-secret-key' with your actual JWT secret key
        req.user = decoded; // Attach the decoded user info to req.user
        next();
    } catch (err) {
        return res.status(401).send({ message: 'Invalid or expired token.' });
    }
};

module.exports = authenticateUser;
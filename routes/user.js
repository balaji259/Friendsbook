const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/users'); // Make sure this points to your User model

const router = express.Router();

// Middleware to fetch user details
const getUserDetails = async (req, res) => {
  try {

    // Log the headers to see the request details
    console.log("Headers:", JSON.stringify(req.headers, null, 2));

    // Check if the Authorization header is present
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: 'Authorization header is missing' });
    }

    // Split the header to extract the token
    const tokenParts = authHeader.split(' ');
    if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
      return res.status(401).json({ message: 'Invalid Authorization format' });
    }

    // Extract the token
    const token = tokenParts[1];

    // Verify the token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET); // Ensure JWT_SECRET is set correctly
    } catch (err) {
      return res.status(401).json({ message: 'Token verification failed', error: err.message });
    }

    // Fetch the user from the database
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Send relevant user data
    res.json({
      username: user.username,
      fullname: user.fullname,
      profilePic: user.profilePic,
    });
  } catch (err) {
    // Catch any server errors
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Define the route
router.get('/getdetails', getUserDetails);

module.exports = router;

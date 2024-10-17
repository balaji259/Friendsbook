
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/users');
const router = express.Router();

// Registration Route
router.post('/register', async (req, res) => {
    const { username, fullname, email, password } = req.body;

    try {
        // Check if user with the same email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered. Please use a different email.' });
        }

        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user instance
        const newUser = new User({
            username,
            fullname,
            email,
            password: hashedPassword, // Save hashed password
        });

        // Save the new user to the database
        await newUser.save();

        // Create a JWT payload with the username and email
        const payload = {
            userId:newUser._id,
            username: newUser.username,
            email: newUser.email,
        };

        // Generate a JWT token that expires in 6 hours
        const token = jwt.sign(payload, process.env.JWT_SECRET);

        // Respond with the generated token
        return res.status(201).json({
            token, 
            message: 'Registration successful!',
        });

    } catch (error) {
        console.error('Error registering user:', error);
        return res.status(500).json({ error: 'Error registering user' });
    }
});

// Login Route
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Find the user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Email not registered' });
        }

        // Verify the password
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(401).json({ error: 'Invalid password' });
        }

        // Define token payload (you can include more user info if needed)
        const payload = {
            userId:user._id,
            username: user.username,
            email: user.email,
        };
        // Generate JWT token
        const token = jwt.sign(payload, process.env.JWT_SECRET);


        // Send token to the client
        res.json({ token });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});



module.exports = router;

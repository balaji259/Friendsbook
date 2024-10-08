const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const connectDB = require('./db/db');
const authRouter = require('./routes/auth'); 
require('dotenv').config();  
const app = express();

// Middleware
app.use(bodyParser.json());  
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/user', authRouter);  

// Connect to MongoDB
connectDB();

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});

// Start the server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

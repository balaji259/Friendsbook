const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const connectDB = require('./db/db');
const authRouter = require('./routes/auth');
const postRouter=require("./routes/postRoutes");
const cors=require('cors'); 
// const upload = require('./routes/upload'); // Import upload middleware
require('dotenv').config();

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

app.use(cors({
  origin: 'http://localhost:8000', // Replace with your frontend URL
  credentials: true, // Allow cookies to be sent
}));
// Connect to MongoDB
connectDB();

// Routes
app.use('/user', authRouter);
app.use('/posts',postRouter);

// Media Upload Route

// app.use((err, req, res, next) => {
//   console.error(err.stack);
//   res.status(500).send('Something went wrong!');
// });

// Start the server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});



const mongoose = require("mongoose");

const url = "mongodb+srv://balajipuneti259:balaji%40521@friendsbook.xlide.mongodb.net/test?retryWrites=true&w=majority";

mongoose.connect

const connectDB = async () => {
  try {
    console.log("connecting DB")
    await mongoose.connect(url, {
      
    });
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed", error);
    process.exit(1);
  }
};

module.exports = connectDB;

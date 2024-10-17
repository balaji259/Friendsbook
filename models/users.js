const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    fullname: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      match: [/.+@.+\..+/, 'Please enter a valid email address'],
    },
    password: {
      type: String,
      required: true,
    },
    profilePic: {
      type: String,
      default: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRHSzDhiRYyjKd2KNCds9Jd500P2tGS5izmzw&s', // URL of the user's profile picture
    },
    bio: {
      type: String,
      trim: true,
      default: '', // A short bio for the user
    },
    postsCount: {   
      type: Number,
      default: 0, // Number of posts created by the user
    },
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the User model for followers
      },
    ],
    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the User model for following
      },
    ],
    relationshipStatus: {
      type: String,
      enum: ['single', 'in a relationship', 'married', 'complicated', 'other'],
      default: 'single', // Relationship status of the user
    },
    streak: {
      count: {
        type: Number,
        default: 0, // Number of consecutive active days (similar to Snapstreak)
      },
      lastActive: {
        type: Date,
        default: null, // Last date of activity to maintain the streak
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);

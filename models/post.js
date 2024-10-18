const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const commentSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },  // User who made the comment
    username: { type: String, required: true },  // Add this field for the username
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});


const postSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },  // User who created the post
    postType: { type: String, enum: ['text', 'image', 'video'], required: true },
    caption: { type: String },  // Caption or text of the post
    content: {
        mediaUrl: { type: String }  // URL of the uploaded media (image or video)
    },
    likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],  // Array of user IDs who liked the post
    comments: [{
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },  // User who made the comment
        username: { type: String, required: true },  // Add this field for the username
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
    }],  // Array of comments (with user details)
    shares: { type: Number, default: 0 },  // Number of shares
    createdAt: { type: Date, default: Date.now }  // Timestamp of when the post was created
});

module.exports = mongoose.model('Post', postSchema)
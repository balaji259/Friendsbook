const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const commentSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true }, 
    username: { type: String, required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    replies: [{ type: Schema.Types.ObjectId, ref: 'Comment' }]  // Array of comment references for nested replies
});

const postSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    postType: { type: String, enum: ['text', 'image', 'video'], required: true },
    caption: { type: String },
    content: { mediaUrl: { type: String } },
    likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    comments: [{ type: Schema.Types.ObjectId, ref: 'Comment' }],
    shares: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

module.exports = {
    Post: mongoose.model('Post', postSchema),
    Comment: mongoose.model('Comment', commentSchema)
};

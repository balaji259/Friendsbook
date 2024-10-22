const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const commentSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true }, 
    username:{type:String,required:true},
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    replies: [{ type: Schema.Types.ObjectId, ref: 'Comment' }]  // Array of comment references for nested replies
});

const postSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },  // User who created the post
    postType: { type: String, enum: ['text', 'image', 'video'], required: true },
    caption: { type: String },  // Caption or text of the post
    content: { mediaUrl: { type: String } },  // URL of the uploaded media (image or video)
    likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],  // Array of user IDs who liked the post
    comments: [{ type: Schema.Types.ObjectId, ref: 'Comment' }],  // Array of comment references
    shares: { type: Number, default: 0 },  // Number of shares
    createdAt: { type: Date, default: Date.now }  // Timestamp of when the post was created
});

module.exports = {
    Post: mongoose.model('Post', postSchema),
    Comment: mongoose.model('Comment', commentSchema)
};

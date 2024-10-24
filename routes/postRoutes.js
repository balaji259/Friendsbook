const express = require('express');
const router = express.Router();
const multer = require('multer');
// const Post = require('../models/post');
const { Post, Comment } = require('../models/post'); 
const Report=require('../models/report');
const authMiddleware = require('../middleware/auth');  // Ensure correct import
const authenticateUser=require('./authenticate_user');
const SavedPost = require('../models/savedPost');


// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/uploads');  // Path to save uploads
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);  // Unique filename
    }
});
const upload = multer({ storage });

// POST route to create a new post
router.post('/create', upload.single('mediaContent'), async (req, res) => {
    try {
        const { captionOrText, userId } = req.body;  // Extract userId from the request body

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        // Determine post type
        let postType = 'text';
        let mediaUrl = null; // Initialize mediaUrl
        if (req.file) {
            const mediaType = req.file.mimetype.split('/')[0];
            postType = mediaType === 'image' ? 'image' : 'video';
            mediaUrl = `/uploads/${req.file.filename}`; // Correct media URL
        }

        // Create a new post
        const post = new Post({
            user: userId,  // Use userId sent from the client-side
            postType,
            caption: captionOrText,
            content: {
                mediaUrl, // Use the constructed mediaUrl
            },
        });

        await post.save();
        res.status(201).json({ message: 'Post created successfully', post });
    } catch (error) {
        console.error('Error creating post:', error); // More specific error logging
        res.status(500).json({ error: error.message || 'Failed to create post' });
    }
});


    router.get('/get', async (req, res) => {
    const userId = req.user ? req.user._id : null; // Optional authentication check

    try {
        const posts = await Post.find({})
    .populate('user', 'username profilePic') // Populate user info for the post
    .populate({
        path: 'comments',
        populate: [
            { path: 'user', select: 'username profilePic' }, // Populate user for comments
            { 
                path: 'replies', 
                populate: { 
                    path: 'user', select: 'username profilePic'  // Populate user for replies
                },
                populate: { 
                    path: 'replies', // Populate nested replies recursively
                    populate: { path: 'user', select: 'username profilePic' }
                }
            }
        ]
    })
    .sort({ createdAt: -1 });

    

        const formattedPosts = posts.map(post => ({
            postId: post._id,
            user: {
                profilePic: post.user?.profilePic || 'default-pic-url',
                username: post.user?.username || 'Unknown User',
            },
            postType: post.postType,
            caption: post.caption,
            content: {
                mediaUrl: post.content.mediaUrl,
            },
            likesCount: post.likes.length,
            likedByUser: userId ? post.likes.includes(userId) : false,
            comments: post.comments.map(comment => ({
                user: comment.user ? {
                    profilePic: comment.user.profilePic || 'default-pic-url',
                    username: comment.user.username || 'Unknown User',
                } : {
                    profilePic: 'default-pic-url',
                    username: 'Unknown User',
                },
                text: comment.text,
                createdAt: comment.createdAt,
                replies: comment.replies.map(reply => ({
                    user: reply.user ? {
                        profilePic: reply.user.profilePic || 'default-pic-url',
                        username: reply.user.username || 'Unknown User',
                    } : {
                        profilePic: 'default-pic-url',
                        username: 'Unknown User',
                    },
                    text: reply.text,
                    createdAt: reply.createdAt,
                    // If there are further nested replies, recursively format them too.
                    replies: reply.replies?.map(nestedReply => ({
                        user: nestedReply.user ? {
                            profilePic: nestedReply.user.profilePic || 'default-pic-url',
                            username: nestedReply.user.username || 'Unknown User',
                        } : {
                            profilePic: 'default-pic-url',
                            username: 'Unknown User',
                        },
                        text: nestedReply.text,
                        createdAt: nestedReply.createdAt,
                    })) || []
                })) || [] // Handle empty replies
            })),
            shares: post.shares,
            createdAt: post.createdAt,
        }));
        
        res.json(formattedPosts);
    } catch (error) {
        console.error('Failed to fetch posts:', error);
        res.status(500).json({ error: 'Failed to fetch posts' });
    }
});


// POST route to like/unlike a post

// Like/Unlike Post
router.post('/like/:userId/:postId', async (req, res) => {
    const { postId, userId } = req.params;
    
    console.log(`postid ${postId}`);
    console.log(`userid ${userId}`);
    
    try {
        // Convert userId to ObjectId
        // const userIdObject = mongoose.Types.ObjectId(userId);

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        // Check if the user has already liked the post
        const userIndex = post.likes.indexOf(userId);

        if (userIndex === -1) {
            // User has not liked the post, so add like
            post.likes.push(userId);
        } else {
            // User already liked the post, so remove the like
            post.likes.splice(userIndex, 1);
        }

        await post.save();
        res.status(200).json({ message: 'Like status updated', likesCount: post.likes.length });
    } catch (error) {
        console.error('Error updating like status:', error);
        res.status(500).json({ error: 'Failed to update like status' });
    }
});


// Add a comment to a post
// Comment route for a specific post
// Example using Express.js
    // Add a new comment to a post
router.post('/comment/:postId', authenticateUser, async (req, res) => {
    const postId = req.params.postId;
    const { text } = req.body;
    const { userId, username } = req.user;

    if (!text || !userId || !username) {
        return res.status(400).send({ message: 'Comment text, user ID, and username are required.' });
    }

    try {
        const newComment = new Comment({
            user: userId,
            username: username,
            text: text,
            createdAt: new Date(),
        });

        // Save the comment before adding it to the post
        await newComment.save();

        const post = await Post.findById(postId);
        if (!post) return res.status(404).send({ message: 'Post not found.' });

        post.comments.push(newComment._id);
        await post.save();

        // Populate the new comment with its replies (if any)
        const populatedComment = await Comment.findById(newComment._id).populate('replies');

        res.status(200).send(populatedComment);
    } catch (error) {
        console.error('Error adding comment:', error.message || error);
        res.status(500).send({ message: 'Error adding comment.', error: error.message });
    }
});

// Add a reply to a comment
router.post('/comment/:postId/reply/:parentId', authenticateUser, async (req, res) => {
    const { postId, parentId } = req.params;
    const { text } = req.body;
    const { userId, username } = req.user;

    if (!text || !userId || !username) {
        return res.status(400).send({ message: 'Reply text, user ID, and username are required.' });
    }

    try {
        const newReply = new Comment({
            user: userId,
            username: username,
            text: text,
            createdAt: new Date(),
        });

        // Save the reply first before pushing its ID to the parent
        await newReply.save();
        console.log('New reply saved:', newReply);

        const parentComment = await Comment.findById(parentId);
        if (!parentComment) {
            console.error('Parent comment not found');
            return res.status(404).send({ message: 'Parent comment not found.' });
        }

        parentComment.replies.push(newReply._id);
        await parentComment.save();

        console.log('Updated Parent Comment:', parentComment);

        const populatedReply = await Comment.findById(newReply._id).populate('replies');

        res.status(200).send(populatedReply);
    } catch (error) {
        console.error('Error adding reply:', error.message || error);
        res.status(500).send({ message: 'Error adding reply.', error: error.message });
    }
});

// Fetch a post with comments and replies
router.get('/post/:postId', async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId)
            .populate({
                path: 'comments',
                populate: {
                    path: 'replies',
                    model: 'Comment',
                    populate: {
                        path: 'replies',
                        model: 'Comment',  // Deep populate more levels if needed
                    }
                },
            });

        if (!post) return res.status(404).send({ message: 'Post not found.' });

        console.log("Populated Post:", JSON.stringify(post, null, 2));
        res.status(200).send(post);
    } catch (error) {
        console.error('Error fetching post:', error.message || error);
        res.status(500).send({ message: 'Error fetching post.', error: error.message });
    }
});


router.post("/report", async (req, res) => {
    try {
        const { userId, postId, reason } = req.body;

        const newReport = new Report({
            userId,
            postId,
            reason,
            reportedAt: new Date()
        });

        await newReport.save();

        res.json({ success: true, message: "Report saved successfully!" });
    } catch (error) {
        console.error("Failed to save report:", error);
        res.status(500).json({ success: false, message: "Failed to submit report." });
    }
});

//savepost

router.post('/save', async (req, res) => {
    const { userId, postId } = req.body;

    try {
        // Check if the post is already saved by the user
        const existingSave = await SavedPost.findOne({ userId, postId });
        if (existingSave) {
            return res.status(400).json({ success: false, message: "Post already saved." });
        }

        const savedPost = new SavedPost({ userId, postId });
        await savedPost.save();

        res.json({ success: true, message: "Post saved successfully." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "An error occurred." });
    }
});

// Route to fetch saved posts by user
router.get('/getsaved/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const savedPosts = await SavedPost.find({ userId }).populate('postId').exec();
        res.json({ success: true, savedPosts });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "An error occurred." });
    }
});



// Share a post
router.post('/share/:postId', authMiddleware, async (req, res) => {
    const { postId } = req.params;

    try {
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        post.shares += 1; // Increment share count
        await post.save();
        res.status(200).json({ message: 'Post shared', shares: post.shares });
    } catch (error) {
        console.error('Error sharing post:', error);
        res.status(500).json({ error: 'Failed to share post' });
    }
});







module.exports = router;

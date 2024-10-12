const express = require('express');
const router = express.Router();
const multer = require('multer');
const Post = require('../models/post');
const authMiddleware = require('../middleware/auth');  // Ensure correct import

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads');  // Path to save uploads
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
        if (req.file) {
            const mediaType = req.file.mimetype.split('/')[0];
            postType = mediaType === 'image' ? 'image' : 'video';
        }

        // Create a new post
        const post = new Post({
            user: userId,  // Use userId sent from the client-side
            postType,
            caption: captionOrText,
            content: {
                mediaUrl: req.file ? `/uploads/${req.file.filename}` : null // Fixed the mediaUrl syntax
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
    try {
        // Fetch posts and populate user and comment user fields
        const posts = await Post.find({})
            .populate('user', 'username profilePic') // Populate user details for each post
            .populate('comments.user', 'username profilePic') // Populate user details for comments
            .sort({ createdAt: -1 }); // Sort posts by newest first
        
        // Prepare the response data
        const formattedPosts = posts.map(post => ({
            user: {
                profilePic: post.user.profilePic,
                username: post.user.username,
            },
            postType: post.postType,
            caption: post.caption,
            content: {
                mediaUrl: post.content.mediaUrl
            },
            likesCount: post.likes.length,
            comments: post.comments.map(comment => ({
                user: {
                    profilePic: comment.user.profilePic,
                    username: comment.user.username,
                },
                text: comment.text,
                createdAt: comment.createdAt,
            })),
            shares: post.shares,
            createdAt: post.createdAt,
        }));
        
        // Send the formatted posts as JSON response
        res.json(formattedPosts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch posts' });
    }
});

module.exports = router;

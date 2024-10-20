const express = require('express');
const router = express.Router();
const multer = require('multer');
const Post = require('../models/post');
const Report=require('../models/report');
const authMiddleware = require('../middleware/auth');  // Ensure correct import
const authenticateUser=require('./authenticate_user');

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
            .populate('user', 'username profilePic')
            .populate('comments.user', 'username profilePic')
            .sort({ createdAt: -1 });

        const formattedPosts = posts.map(post => ({
            postId: post._id,
            //added
            userId:post.user,

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
            likedByUser: userId ? post.likes.includes(userId) : false, // Check if the user liked the post
            comments: post.comments.map(comment => ({
                user: comment.user ? {
                    profilePic: comment.user.profilePic,
                    username: comment.user.username,
                } : {
                    profilePic: 'default-pic-url',
                    username: 'Unknown User',
                },
                text: comment.text,
                createdAt: comment.createdAt,
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
router.post('/comment/:postId', authenticateUser, async (req, res) => {
    const postId = req.params.postId;
    const commentText = req.body.text;
    const { userId, username } = req.user; // Extract user details

    console.log(`User ID: ${userId}, Username: ${username}, Comment Text: ${commentText}`);

    // Validate input
    if (!commentText || !userId || !username) {
        return res.status(400).send({ message: 'Comment text, user ID, and username are required.' });
    }

    try {
        const post = await Post.findById(postId);
        if (!post) return res.status(404).send({ message: 'Post not found.' });

        // Create the new comment object
        const newComment = {
            user: userId, // Ensure this is a valid ObjectId
            username: username, // Ensure this is a valid string
            text: commentText, // Text content of the comment
            createdAt: new Date() // Timestamp of comment creation
        };

        console.log("New Comment:", newComment); // Log the new comment for debugging

        // Push the new comment to the comments array
        post.comments.push(newComment);

        await post.save(); // Save the updated post

        // Send back the newly added comment
        const lastComment = post.comments[post.comments.length - 1];
        const responseComment = {
            text: lastComment.text,
            user: {
                userId: lastComment.user, // This is the ObjectId
                username: lastComment.username
            },
            createdAt: lastComment.createdAt // Include the createdAt timestamp
        };

        res.status(200).send(responseComment);
    } catch (error) {
        console.error('Error adding comment:', error.message || error);
        res.status(500).send({ message: 'Error adding comment.', error: error.message });
    }
});


router.get('/:postId', async (req, res) => {
    const { postId } = req.params;

    try {
        const post = await Post.findById(postId)
            .populate("user", "username profilePic")
            .populate("comments.user", "username profilePic");

        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }

        res.json({
            postId: post._id,
            user: {
                profilePic: post.user?.profilePic || "default-pic-url",
                username: post.user?.username || "Unknown User",
            },
            postType: post.postType,
            caption: post.caption,
            content: post.content,
            likesCount: post.likes.length,
            comments: post.comments.map(comment => ({
                user: {
                    profilePic: comment.user.profilePic || "default-pic-url",
                    username: comment.user.username || "Unknown User",
                },
                text: comment.text,
                createdAt: comment.createdAt,
            })),
            shares: post.shares,
            createdAt: post.createdAt,
        });
    } catch (error) {
        console.error("Error fetching post:", error);
        res.status(500).json({ error: "Failed to fetch post" });
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

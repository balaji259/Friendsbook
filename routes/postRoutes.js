const express = require('express');
const router = express.Router();
const multer = require('multer');
const Post = require('../models/post');
const authMiddleware = require('../middleware/auth');  // Ensure correct import

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

// router.get('/get', async (req, res) => {
//     try {
//         // Fetch posts and populate user and comment user fields
//         const posts = await Post.find({})
//             .populate('user', 'username profilePic') // Populate user details for each post
//             .populate('comments.user', 'username profilePic') // Populate user details for comments
//             .sort({ createdAt: -1 }); // Sort posts by newest first
        
//         // Prepare the response data
//         const formattedPosts = posts.map(post => ({
            
//             postId: post._id, // Include postId here
//             user: {

//                 profilePic: post.user.profilePic,
//                 username: post.user.username,
//             },
//             postType: post.postType,
//             caption: post.caption,
//             content: {
//                 mediaUrl: post.content.mediaUrl
//             },
//             likesCount: post.likes.length,
//             comments: post.comments.map(comment => ({
//                 user: {
//                     profilePic: comment.user.profilePic,
//                     username: comment.user.username,
//                 },
//                 text: comment.text,
//                 createdAt: comment.createdAt,
//             })),
//             shares: post.shares,
//             createdAt: post.createdAt,
//         }));
        

//         // Send the formatted posts as JSON response
//         res.json(formattedPosts);
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ error: 'Failed to fetch posts' });
//     }
// });


//likecomment share

// Like a post

router.get('/get', async (req, res) => {
    try {
        // Fetch posts and populate user and comment user fields
        const posts = await Post.find({})
            .populate('user', 'username profilePic') // Populate user details for each post
            .populate('comments.user', 'username profilePic') // Populate user details for comments
            .sort({ createdAt: -1 }); // Sort posts by newest first
        
        // Prepare the response data
        const formattedPosts = posts.map(post => ({
            postId: post._id, // Include postId here
            user: {
                profilePic: post.user?.profilePic || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRHSzDhiRYyjKd2KNCds9Jd500P2tGS5izmzw&s', // Default profile pic
                username: post.user?.username || 'Unknown User',
            },
            postType: post.postType,
            caption: post.caption,
            content: {
                mediaUrl: post.content.mediaUrl
            },
            likesCount: post.likes.length,
            comments: post.comments.map(comment => ({
                user: comment.user ? {
                    profilePic: comment.user.profilePic,
                    username: comment.user.username,
                } : {
                    profilePic: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRHSzDhiRYyjKd2KNCds9Jd500P2tGS5izmzw&s', // Default profile pic
                    username: 'Unknown User',
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



router.post('/like/:postId', authMiddleware, async (req, res) => {
    const { postId } = req.params;
    const userId = req.user._id; // Assuming you're using auth middleware to get the user ID

    try {
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        // Toggle like
        if (post.likes.includes(userId)) {
            // User already liked the post, so remove like
            post.likes.pull(userId);
        } else {
            // User has not liked the post, so add like
            post.likes.push(userId);
        }

        await post.save();
        res.status(200).json({ message: 'Like updated', likesCount: post.likes.length });
    } catch (error) {
        console.error('Error liking post:', error);
        res.status(500).json({ error: 'Failed to update like' });
    }
});

// Add a comment to a post
router.post('/comment/:postId', authMiddleware, async (req, res) => {
    const { postId } = req.params;
    const { text } = req.body; // Get the comment text

    try {
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        // Create a new comment
        const comment = {
            user: req.user._id, // Assuming user ID is set in req.user by auth middleware
            text,
        };

        post.comments.push(comment);
        await post.save();
        res.status(201).json({ message: 'Comment added', comments: post.comments });
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ error: 'Failed to add comment' });
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

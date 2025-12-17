const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const JSON_FILE = 'database_827_383_294_103_759_927_953.json';

// Read posts from JSON file
async function readPosts() {
    try {
        const data = await fs.readFile(JSON_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // If file doesn't exist, create empty array
        if (error.code === 'ENOENT') {
            return { posts: [] };
        }
        throw error;
    }
}

// Write posts to JSON file
async function writePosts(posts) {
    await fs.writeFile(JSON_FILE, JSON.stringify(posts, null, 2));
}

// API endpoint to create new post
app.post('/api/posts', async (req, res) => {
    try {
        const newPost = req.body;
        
        // Validate required fields
        if (!newPost.content || !newPost.name) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        // Read existing posts
        const data = await readPosts();
        
        // Add new post to the beginning of the array
        data.posts.unshift(newPost);
        
        // Limit posts if needed (optional)
        if (data.posts.length > 1000) {
            data.posts = data.posts.slice(0, 1000);
        }
        
        // Write back to file
        await writePosts(data);
        
        res.json({ success: true, post: newPost });
    } catch (error) {
        console.error('Error saving post:', error);
        res.status(500).json({ error: 'Failed to save post' });
    }
});

// API endpoint to get all posts
app.get('/api/posts', async (req, res) => {
    try {
        const data = await readPosts();
        res.json(data.posts || []);
    } catch (error) {
        console.error('Error reading posts:', error);
        res.status(500).json({ error: 'Failed to read posts' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
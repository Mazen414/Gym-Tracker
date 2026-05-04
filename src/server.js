const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDB } = require('./services/db');

// Initialize the Express app
const app = express();
const PORT = 3000;

// --- Middleware ---
app.use(cors()); // Allows your frontend to communicate securely with your API
app.use(express.json()); // Automatically parses incoming JSON data from your fetch requests

// Serve your SPA: This tells Express to serve your index.html and app.js from the public folder
app.use(express.static(path.join(__dirname, '../public')));

// --- API Routes (We will add more later) ---
// A simple health check route to test our server
app.get('/api/health', (req, res) => {
    res.json({ message: 'Gym Tracker API is running smoothly!' });
});

// Explicitly serve the index.html file when someone visits the root URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// --- Start the Server ---
app.listen(PORT, async () => {
    console.log(`Server is locked in and running on http://localhost:${PORT}`);
    // Test the database connection when the server starts
    await connectDB(); 
});
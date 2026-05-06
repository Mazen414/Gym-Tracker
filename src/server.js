const express = require('express');
const path = require('path');
const { initSchema } = require('./services/db');

// Initialize the Express application
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to serve your frontend files from the 'public' folder
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());

// The "Fail-Fast" startup function from your friend's code
async function start() {
  try {
    // 1. Try to connect and initialize the database first
    await initSchema();
    console.log('Connected to SQL Server — tables ready.');
    
    // 2. If the database works, start the web server
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (err) {
    // 3. If the database fails, log the error and crash cleanly
    console.error('Failed to start:', err.message);
    process.exit(1);
  }
}

// Kick off the application
start();
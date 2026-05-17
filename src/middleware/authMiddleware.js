const jwt = require('jsonwebtoken');

// This must match the exact secret key you used in auth.js!
const JWT_SECRET = 'gym_tracker_super_secret_key_2026';

function authenticateToken(req, res, next) {
    // 1. Look for the token in the HTTP Headers
    const authHeader = req.headers['authorization'];
    
    // The header usually looks like: "Bearer eyJhbGciOiJIUzI1..."
    // We split it by the space and grab the second part (the actual token)
    const token = authHeader && authHeader.split(' ')[1];

    // 2. If there is no token at all, reject them
    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    // 3. Verify the token is real and hasn't expired
    jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token.' });
        }

        // 4. Success! Attach the user's ID to the request so the SQL routes can use it
        req.user = decodedUser;
        
        // Move on to the actual route they were trying to reach
        next(); 
    });
}

module.exports = authenticateToken;
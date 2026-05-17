const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getPool } = require('../services/db');

const router = express.Router();

// The secret key used to sign the wristbands (in production, this goes in a .env file!)
const JWT_SECRET = 'gym_tracker_super_secret_key_2026'; 

// POST: Register a new user
router.post('/register', async (req, res) => {
    const { username, password } = req.body;

    try {
        const pool = await getPool();

        // 1. Check if username is already taken
        const userCheck = await pool.request()
            .input('username', username)
            .query('SELECT * FROM Users WHERE username = @username');

        if (userCheck.recordset.length > 0) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        // 2. Scramble (Hash) the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Save the new user to the database
        await pool.request()
            .input('username', username)
            .input('password_hash', hashedPassword)
            .query(`
                INSERT INTO Users (username, password_hash)
                VALUES (@username, @password_hash)
            `);

        res.status(201).json({ message: 'User registered successfully!' });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ error: 'Failed to register user' });
    }
});

// POST: Login and get a JWT
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const pool = await getPool();

        // 1. Find the user in the database
        const result = await pool.request()
            .input('username', username)
            .query('SELECT * FROM Users WHERE username = @username');

        const user = result.recordset[0];
        if (!user) {
            return res.status(400).json({ error: 'Invalid username or password' });
        }

        // 2. Compare the typed password with the hashed password in the DB
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid username or password' });
        }

        // 3. Success! Create the JWT (VIP Wristband)
        const token = jwt.sign(
            { userId: user.id, username: user.username },
            JWT_SECRET,
            { expiresIn: '24h' } // Token expires in 24 hours
        );

        res.status(200).json({ 
            message: 'Login successful', 
            token: token,
            username: user.username
        });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Failed to login' });
    }
});

module.exports = router;
const express = require('express');
const path = require('path');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const { initSchema } = require('./services/db');

const app = express();
const PORT = process.env.PORT || 3000;

// --- SWAGGER CONFIGURATION ---
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Gym Tracker API',
      version: '1.0.0',
      description: 'SQL Server Backend for Gym Workout Tracking',
      contact: {
        name: 'Developer'
      },
      servers: [{ url: `http://localhost:${PORT}` }]
    },
  },
  // This tells Swagger to look for documentation in this file and any file in routes
  apis: [__filename, './src/routes/*.js'], 
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// --- MIDDLEWARE ---
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Verify server health
 *     description: Returns a simple message to confirm the server is running.
 *     responses:
 *       200:
 *         description: Server is healthy.
 */
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', message: 'Gym Tracker Backend is active' });
});

// --- STARTUP LOGIC ---
async function start() {
  try {
    // 1. Initialize Database Schema
    await initSchema();
    console.log('Connected to SQL Server — tables ready.');
    
    // 2. Start Express Server
    app.listen(PORT, () => {
      console.log(`
🚀 Server running at http://localhost:${PORT}
- Static files: http://localhost:${PORT}
- API Docs:    http://localhost:${PORT}/api-docs
      `);
    });
  } catch (err) {
    console.error('Failed to start:', err.message);
    process.exit(1);
  }
}

const workoutRoutes = require('./routes/workouts');
const authRoutes = require('./routes/auth');
app.use('/api/workouts', workoutRoutes);
app.use('/api/auth', authRoutes);

start();
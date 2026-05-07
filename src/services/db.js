const sql = require('mssql');

const config = {
  // Use 127.0.0.1 to bypass Windows localhost mapping issues
  server: '127.0.0.1', 
  authentication: {
    type: 'default',
    options: {
      userName: 'gym_node_user',      
      password: 'GymTracker@2026',   
    },
  },
  options: {
    // ⚠️ REPLACE 50214 WITH THE EXACT NUMBER YOU FOUND IN STEP 1
    port: 1433, 
    database: 'GymTrackerDB',        
    trustServerCertificate: true,
    encrypt: true,
    enableArithAbort: true,
  },
};

let pool;

/**
 * Singleton function to get or create the DB connection pool.
 */
async function getPool() {
  try {
    if (!pool) {
      pool = await sql.connect(config);
      console.log('Successfully connected to GymTrackerDB using SQL Authentication!');
    }
    return pool;
  } catch (err) {
    console.error('Database connection failed: ', err);
    throw err;
  }
}

/**
 * Initializes the database schema for Gym Tracker.
 */
async function initSchema() {
  try {
    const p = await getPool();

    // 1. Create Workouts Table
    await p.request().query(`
      IF OBJECT_ID('Workouts', 'U') IS NULL
      CREATE TABLE Workouts (
          id INT PRIMARY KEY IDENTITY(1,1),
          date DATE NOT NULL,
          notes NVARCHAR(MAX)
      );
    `);

    // 2. Create Strength_Logs Table
    await p.request().query(`
      IF OBJECT_ID('Strength_Logs', 'U') IS NULL
      CREATE TABLE Strength_Logs (
          id INT PRIMARY KEY IDENTITY(1,1),
          workout_id INT FOREIGN KEY REFERENCES Workouts(id) ON DELETE CASCADE,
          exercise_name NVARCHAR(100) NOT NULL,
          sets INT,
          reps INT,
          weight_kg DECIMAL(5,2)
      );
    `);

    // 3. Create Cardio_Logs Table
    await p.request().query(`
      IF OBJECT_ID('Cardio_Logs', 'U') IS NULL
      CREATE TABLE Cardio_Logs (
          id INT PRIMARY KEY IDENTITY(1,1),
          workout_id INT FOREIGN KEY REFERENCES Workouts(id) ON DELETE CASCADE,
          exercise_name NVARCHAR(100) NOT NULL,
          duration_minutes INT,
          distance_km DECIMAL(5,2)
      );
    `);

    console.log('Gym Tracker database schema verified and initialized.');
  } catch (err) {
    console.error('Schema initialization failed: ', err);
  }
}

module.exports = { getPool, initSchema, sql };
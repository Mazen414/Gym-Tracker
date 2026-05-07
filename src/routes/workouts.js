const express = require('express');
const router = express.Router();
const { getPool } = require('../services/db');

/**
 * @openapi
 * {
 * "/api/workouts": {
 * "post": {
 * "summary": "Create a workout session",
 * "requestBody": {
 * "required": true,
 * "content": {
 * "application/json": {
 * "schema": {
 * "type": "object",
 * "properties": {
 * "date": { "type": "string", "example": "2026-05-06" },
 * "notes": { "type": "string", "example": "Leg day was intense." }
 * }
 * }
 * }
 * }
 * },
 * "responses": {
 * "201": { "description": "Workout created successfully" }
 * }
 * },
 * "get": {
 * "summary": "Get all workouts",
 * "responses": {
 * "200": { "description": "List of all workouts" }
 * }
 * }
 * },
 * "/api/workouts/{id}/strength": {
 * "post": {
 * "summary": "Add a strength exercise to a workout",
 * "parameters": [
 * { "in": "path", "name": "id", "required": true, "schema": { "type": "integer" } }
 * ],
 * "requestBody": {
 * "required": true,
 * "content": {
 * "application/json": {
 * "schema": {
 * "type": "object",
 * "properties": {
 * "exercise_name": { "type": "string", "example": "Squat" },
 * "sets": { "type": "integer", "example": 3 },
 * "reps": { "type": "integer", "example": 10 },
 * "weight_kg": { "type": "number", "example": 100.5 }
 * }
 * }
 * }
 * }
 * },
 * "responses": {
 * "201": { "description": "Strength exercise added" },
 * "404": { "description": "Workout ID not found" },
 * "500": { "description": "Server error" }
 * }
 * }
 * }
 * }
 */

router.post('/', async (req, res) => {
  const { date, notes } = req.body;
  try {
    const pool = await getPool();
    await pool.request()
      .input('date', date)
      .input('notes', notes)
      .query('INSERT INTO Workouts (date, notes) VALUES (@date, @notes)');
    res.status(201).json({ message: 'Workout logged successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create workout' });
  }
});

router.get('/', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query('SELECT * FROM Workouts ORDER BY date DESC');
    res.status(200).json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve workouts' });
  }
});

router.post('/:id/strength', async (req, res) => {
  const workoutId = req.params.id;
  const { exercise_name, sets, reps, weight_kg } = req.body;

  try {
    const pool = await getPool();
    
    const checkWorkout = await pool.request()
      .input('id', workoutId)
      .query('SELECT id FROM Workouts WHERE id = @id');
      
    if (checkWorkout.recordset.length === 0) {
      return res.status(404).json({ error: 'Workout not found' });
    }

    await pool.request()
      .input('workout_id', workoutId)
      .input('exercise_name', exercise_name)
      .input('sets', sets)
      .input('reps', reps)
      .input('weight_kg', weight_kg)
      .query(`
        INSERT INTO Strength_Logs (workout_id, exercise_name, sets, reps, weight_kg) 
        VALUES (@workout_id, @exercise_name, @sets, @reps, @weight_kg)
      `);
      
    res.status(201).json({ message: 'Strength exercise added successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add strength exercise' });
  }
});

/**
 * @openapi
 * {
 * "/api/workouts/{id}": {
 * "get": {
 * "summary": "Get a single workout with all attached exercises",
 * "parameters": [
 * { "in": "path", "name": "id", "required": true, "schema": { "type": "integer" } }
 * ],
 * "responses": {
 * "200": { "description": "Detailed workout object with nested exercises" },
 * "404": { "description": "Workout not found" },
 * "500": { "description": "Server error" }
 * }
 * }
 * }
 * }
 */
router.get('/:id', async (req, res) => {
  const workoutId = req.params.id;

  try {
    const pool = await getPool();
    
    // We run three SELECT statements separated by semicolons in ONE query
    const result = await pool.request()
      .input('id', workoutId)
      .query(`
        SELECT * FROM Workouts WHERE id = @id;
        SELECT * FROM Strength_Logs WHERE workout_id = @id;
        SELECT * FROM Cardio_Logs WHERE workout_id = @id;
      `);

    // result.recordsets is an array containing the results of each query above
    const workoutData = result.recordsets[0];
    const strengthData = result.recordsets[1];
    const cardioData = result.recordsets[2];

    // If the first query came back empty, the workout doesn't exist
    if (workoutData.length === 0) {
      return res.status(404).json({ error: 'Workout not found' });
    }

    // Combine everything into one beautiful nested JSON object
    const fullWorkout = {
      ...workoutData[0],
      strength_logs: strengthData,
      cardio_logs: cardioData
    };

    res.status(200).json(fullWorkout);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve workout data' });
  }
});

/**
 * @openapi
 * {
 * "/api/workouts/{id}": {
 * "delete": {
 * "summary": "Delete a workout and all attached exercises",
 * "parameters": [
 * { "in": "path", "name": "id", "required": true, "schema": { "type": "integer" } }
 * ],
 * "responses": {
 * "200": { "description": "Workout deleted successfully" },
 * "404": { "description": "Workout not found" },
 * "500": { "description": "Server error" }
 * }
 * }
 * }
 * }
 */
router.delete('/:id', async (req, res) => {
  const workoutId = req.params.id;

  try {
    const pool = await getPool();
    
    // Attempt to delete the workout. The OUTPUT clause lets us know if a row was actually deleted.
    const result = await pool.request()
      .input('id', workoutId)
      .query(`
        DELETE FROM Workouts 
        OUTPUT deleted.id 
        WHERE id = @id
      `);

    // If no rows were outputted, the ID didn't exist
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Workout not found' });
    }

    res.status(200).json({ message: 'Workout and all associated exercises deleted successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete workout' });
  }
});

module.exports = router;
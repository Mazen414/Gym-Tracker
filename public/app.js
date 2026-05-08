// --- 1. DEFINE TEMPLATES & GLOBAL STATE ---
let editingExerciseId = null; // Keeps track of what we are editing

const strengthFormHTML = `
    <div class="form-group">
        <label>Exercise Name:</label>
        <input type="text" id="exercise_name" placeholder="e.g., Bench Press" required>
    </div>
    <div class="form-group">
        <label>Sets:</label>
        <input type="number" id="sets" required>
    </div>
    <div class="form-group">
        <label>Reps:</label>
        <input type="number" id="reps" required>
    </div>
    <div class="form-group">
        <label>Weight (kg):</label>
        <input type="number" step="0.5" id="weight_kg" required>
    </div>
`;

const cardioFormHTML = `
    <div class="form-group">
        <label>Exercise Name:</label>
        <input type="text" id="exercise_name" placeholder="e.g., Treadmill" required>
    </div>
    <div class="form-group">
        <label>Duration (minutes):</label>
        <input type="number" id="duration_minutes" required>
    </div>
    <div class="form-group">
        <label>Distance (km):</label>
        <input type="number" step="0.1" id="distance_km" required>
    </div>
`;

// --- 2. INITIALIZE PAGE ---
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('dynamic-inputs').innerHTML = strengthFormHTML;
    fetchWorkouts();

    document.getElementById('workout-form').addEventListener('submit', createWorkout);
    document.getElementById('exercise-form').addEventListener('submit', saveExercise);
    
    document.getElementById('exercise-type').addEventListener('change', (e) => {
        const container = document.getElementById('dynamic-inputs');
        container.innerHTML = e.target.value === 'strength' ? strengthFormHTML : cardioFormHTML;
    });
});

// --- 3. FETCH & RENDER DATA ---
async function fetchWorkouts() {
    const workoutList = document.getElementById('workout-list');
    const targetSelect = document.getElementById('target-workout');
    
    try {
        const response = await fetch('/api/workouts'); 
        const basicWorkouts = await response.json();

        workoutList.innerHTML = '';
        targetSelect.innerHTML = '<option value="" disabled selected>Select a session...</option>';

        if (basicWorkouts.length === 0) {
            workoutList.innerHTML = '<p>No workouts found. Time to lift!</p>';
            return;
        }

        for (const basic of basicWorkouts) {
            const dateStr = new Date(basic.date).toLocaleDateString();
            
            const option = document.createElement('option');
            option.value = basic.id;
            option.textContent = `Workout on ${dateStr} (ID: ${basic.id})`;
            targetSelect.appendChild(option);

            const detailResponse = await fetch(`/api/workouts/${basic.id}`);
            const fullWorkout = await detailResponse.json();

            let exercisesHTML = '';
            
            // Render Strength Logs with an Edit button
            fullWorkout.strength_logs.forEach(ex => {
                exercisesHTML += `
                <li style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <span style="color:#c0392b;">💪 <strong>${ex.exercise_name}</strong>: ${ex.sets}x${ex.reps} @ ${ex.weight_kg}kg</span>
                    <button type="button" onclick="startEdit(${ex.id}, 'strength', ${fullWorkout.id}, '${ex.exercise_name}', ${ex.sets}, ${ex.reps}, ${ex.weight_kg})" style="padding: 4px 8px; font-size: 12px; background: #34495e; color: white; border: none; border-radius: 3px; cursor: pointer;">Edit</button>
                </li>`;
            });
            
            // Render Cardio Logs with an Edit button
            fullWorkout.cardio_logs.forEach(ex => {
                exercisesHTML += `
                <li style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <span style="color:#2980b9;">🏃 <strong>${ex.exercise_name}</strong>: ${ex.duration_minutes} mins, ${ex.distance_km}km</span>
                    <button type="button" onclick="startEdit(${ex.id}, 'cardio', ${fullWorkout.id}, '${ex.exercise_name}', ${ex.duration_minutes}, ${ex.distance_km})" style="padding: 4px 8px; font-size: 12px; background: #34495e; color: white; border: none; border-radius: 3px; cursor: pointer;">Edit</button>
                </li>`;
            });

            if (exercisesHTML === '') {
                exercisesHTML = '<li><em>No exercises logged yet.</em></li>';
            }

            const div = document.createElement('div');
            div.className = 'workout-item';
            div.innerHTML = `
                <h3>Workout on ${dateStr}</h3>
                <p><strong>Notes:</strong> ${fullWorkout.notes || 'No notes'}</p>
                <h4 style="margin-top: 10px;">Exercises:</h4>
                <ul style="list-style-type: none; padding-left: 0; margin-bottom: 10px; line-height: 1.8;">
                    ${exercisesHTML}
                </ul>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 15px; border-top: 1px solid #eee; padding-top: 10px;">
                    <small style="color: #7f8c8d;">Workout ID: ${fullWorkout.id}</small>
                    <button class="delete-btn" onclick="deleteWorkout(${fullWorkout.id})">Delete Session</button>
                </div>
            `;
            workoutList.appendChild(div);
        }
    } catch (err) {
        console.error('Error fetching workouts:', err);
    }
}

// --- 4. PREPARE THE FORM FOR EDITING ---
// This is triggered when you click the tiny "Edit" button
function startEdit(exerciseId, type, workoutId, name, val1, val2, val3) {
    editingExerciseId = exerciseId;

    // Change the form dropdowns to match the exercise
    document.getElementById('target-workout').value = workoutId;
    const typeSelect = document.getElementById('exercise-type');
    typeSelect.value = type;

    // Force the correct template to load immediately
    typeSelect.dispatchEvent(new Event('change'));

    // Populate the template with the existing data
    document.getElementById('exercise_name').value = name;
    if (type === 'strength') {
        document.getElementById('sets').value = val1;
        document.getElementById('reps').value = val2;
        document.getElementById('weight_kg').value = val3;
    } else {
        document.getElementById('duration_minutes').value = val1;
        document.getElementById('distance_km').value = val2;
    }

    // Give the user a visual clue that they are editing, not creating
    document.querySelector('#exercise-form button').textContent = 'Update Exercise';
    document.querySelector('#exercise-form button').style.background = '#f39c12'; // Orange warning color
}

// --- 5. SAVE (CREATE OR UPDATE) EXERCISE ---
async function saveExercise(e) {
    e.preventDefault();

    const workoutId = document.getElementById('target-workout').value;
    const currentType = document.getElementById('exercise-type').value;
    
    let payload = { exercise_name: document.getElementById('exercise_name').value };
    let endpoint = `/api/workouts/${workoutId}/${currentType}`;
    let method = 'POST'; // Default to creating a new record

    // If we are holding an ID in memory, change to Update Mode
    if (editingExerciseId) {
        method = 'PUT';
        endpoint += `/${editingExerciseId}`;
    }

    if (currentType === 'strength') {
        payload.sets = parseInt(document.getElementById('sets').value);
        payload.reps = parseInt(document.getElementById('reps').value);
        payload.weight_kg = parseFloat(document.getElementById('weight_kg').value);
    } else {
        payload.duration_minutes = parseInt(document.getElementById('duration_minutes').value);
        payload.distance_km = parseFloat(document.getElementById('distance_km').value);
    }

    try {
        const response = await fetch(endpoint, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            // Reset the form styling back to normal
            editingExerciseId = null;
            document.querySelector('#exercise-form button').textContent = 'Save Exercise';
            document.querySelector('#exercise-form button').style.background = '#e74c3c'; // Back to red
            
            // Clear inputs
            document.getElementById('exercise_name').value = '';
            if (currentType === 'strength') {
                document.getElementById('sets').value = '';
                document.getElementById('reps').value = '';
                document.getElementById('weight_kg').value = '';
            } else {
                document.getElementById('duration_minutes').value = '';
                document.getElementById('distance_km').value = '';
            }
            
            fetchWorkouts(); 
        } else {
            alert('Failed to save exercise.');
        }
    } catch (error) {
        console.error(error);
    }
}

// --- 6. CREATE WORKOUT ---
async function createWorkout(e) {
    e.preventDefault();
    const dateInput = document.getElementById('date').value;
    const notesInput = document.getElementById('notes').value;

    try {
        const response = await fetch('/api/workouts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date: dateInput, notes: notesInput })
        });
        if (response.ok) {
            document.getElementById('workout-form').reset();
            fetchWorkouts();
        }
    } catch (err) { console.error(err); }
}

// --- 7. DELETE WORKOUT ---
async function deleteWorkout(id) {
    if (!confirm('Are you sure you want to delete this workout and all its exercises?')) return; 
    try {
        const response = await fetch(`/api/workouts/${id}`, { method: 'DELETE' });
        if (response.ok) fetchWorkouts();
    } catch (err) { console.error(err); }
}
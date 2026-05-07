// --- 1. DEFINE TEMPLATES ---
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
    // Set initial dynamic form to Strength
    document.getElementById('dynamic-inputs').innerHTML = strengthFormHTML;

    // Load data from SQL
    fetchWorkouts();

    // Event Listeners
    document.getElementById('workout-form').addEventListener('submit', createWorkout);
    document.getElementById('exercise-form').addEventListener('submit', createExercise);
    
    // Swap form templates when dropdown changes
    document.getElementById('exercise-type').addEventListener('change', (e) => {
        const container = document.getElementById('dynamic-inputs');
        if (e.target.value === 'strength') {
            container.innerHTML = strengthFormHTML;
        } else {
            container.innerHTML = cardioFormHTML;
        }
    });
});

// --- 3. FETCH & RENDER DATA ---
async function fetchWorkouts() {
    const workoutList = document.getElementById('workout-list');
    const targetSelect = document.getElementById('target-workout');
    
    try {
        // Step A: Get the list of all workouts
        const response = await fetch('/api/workouts'); 
        const basicWorkouts = await response.json();

        workoutList.innerHTML = '';
        targetSelect.innerHTML = '<option value="" disabled selected>Select a session...</option>';

        if (basicWorkouts.length === 0) {
            workoutList.innerHTML = '<p>No workouts found. Time to lift!</p>';
            return;
        }

        // Step B: Loop through each workout to get its nested exercises
        for (const basic of basicWorkouts) {
            const dateStr = new Date(basic.date).toLocaleDateString();
            
            // Populate the dropdown menu so we can add exercises to it later
            const option = document.createElement('option');
            option.value = basic.id;
            option.textContent = `Workout on ${dateStr} (ID: ${basic.id})`;
            targetSelect.appendChild(option);

            // Fetch the FULL details for this specific workout
            const detailResponse = await fetch(`/api/workouts/${basic.id}`);
            const fullWorkout = await detailResponse.json();

            // Build the HTML for the exercises
            let exercisesHTML = '';
            
            fullWorkout.strength_logs.forEach(ex => {
                exercisesHTML += `<li style="color:#c0392b;">💪 <strong>${ex.exercise_name}</strong>: ${ex.sets}x${ex.reps} @ ${ex.weight_kg}kg</li>`;
            });
            
            fullWorkout.cardio_logs.forEach(ex => {
                exercisesHTML += `<li style="color:#2980b9;">🏃 <strong>${ex.exercise_name}</strong>: ${ex.duration_minutes} mins, ${ex.distance_km}km</li>`;
            });

            if (exercisesHTML === '') {
                exercisesHTML = '<li><em>No exercises logged yet.</em></li>';
            }

            // Render the card
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

// --- 4. CREATE WORKOUT ---
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
            fetchWorkouts(); // Refresh the list
        }
    } catch (err) {
        console.error(err);
    }
}

// --- 5. CREATE EXERCISE ---
async function createExercise(e) {
    e.preventDefault();

    const workoutId = document.getElementById('target-workout').value;
    const currentType = document.getElementById('exercise-type').value;
    
    let payload = {
        exercise_name: document.getElementById('exercise_name').value
    };
    let endpoint = '';

    // Gather data based on the active template
    if (currentType === 'strength') {
        payload.sets = parseInt(document.getElementById('sets').value);
        payload.reps = parseInt(document.getElementById('reps').value);
        payload.weight_kg = parseFloat(document.getElementById('weight_kg').value);
        endpoint = `/api/workouts/${workoutId}/strength`;
    } else {
        payload.duration_minutes = parseInt(document.getElementById('duration_minutes').value);
        payload.distance_km = parseFloat(document.getElementById('distance_km').value);
        endpoint = `/api/workouts/${workoutId}/cardio`;
    }

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            // Clear the exercise name and specific inputs, keep the dropdowns intact
            document.getElementById('exercise_name').value = '';
            if (currentType === 'strength') {
                document.getElementById('sets').value = '';
                document.getElementById('reps').value = '';
                document.getElementById('weight_kg').value = '';
            } else {
                document.getElementById('duration_minutes').value = '';
                document.getElementById('distance_km').value = '';
            }
            
            fetchWorkouts(); // Refresh the list to show the new exercise!
        } else {
            alert('Failed to log exercise.');
        }
    } catch (error) {
        console.error(error);
    }
}

// --- 6. DELETE WORKOUT ---
async function deleteWorkout(id) {
    if (!confirm('Are you sure you want to delete this workout and all its exercises?')) return; 

    try {
        const response = await fetch(`/api/workouts/${id}`, { method: 'DELETE' });
        if (response.ok) fetchWorkouts();
    } catch (err) {
        console.error(err);
    }
}
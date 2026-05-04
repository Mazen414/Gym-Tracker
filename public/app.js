// 1. Define your Template Literals
const strengthFormHTML = `
    <div class="input-group">
        <label>Exercise Name:</label>
        <input type="text" id="name" placeholder="e.g., Bench Press" required>
    </div>
    <div class="input-group">
        <label>Sets:</label>
        <input type="number" id="sets" required>
    </div>
    <div class="input-group">
        <label>Reps:</label>
        <input type="number" id="reps" required>
    </div>
    <div class="input-group">
        <label>Weight (kg):</label>
        <input type="number" step="0.5" id="weight" required>
    </div>
`;

const cardioFormHTML = `
    <div class="input-group">
        <label>Exercise Name:</label>
        <input type="text" id="name" placeholder="e.g., Treadmill" required>
    </div>
    <div class="input-group">
        <label>Duration (minutes):</label>
        <input type="number" id="duration" required>
    </div>
    <div class="input-group">
        <label>Distance (km):</label>
        <input type="number" step="0.1" id="distance" required>
    </div>
`;

// 2. Grab DOM Elements
const typeSelector = document.getElementById('exercise-type');
const dynamicContainer = document.getElementById('dynamic-inputs');
const workoutForm = document.getElementById('workout-form');

// 3. Render Initial Form on Page Load
dynamicContainer.innerHTML = strengthFormHTML;

// 4. Listen for Dropdown Changes to Swap Templates
typeSelector.addEventListener('change', function(event) {
    if (event.target.value === 'strength') {
        dynamicContainer.innerHTML = strengthFormHTML;
    } else if (event.target.value === 'cardio') {
        dynamicContainer.innerHTML = cardioFormHTML;
    }
});

// 5. Handle Form Submission via Fetch (No Reloading!)
workoutForm.addEventListener('submit', async function(event) {
    // Prevent the browser from refreshing the page
    event.preventDefault(); 

    const currentType = typeSelector.value;
    let exerciseData = {
        type: currentType,
        name: document.getElementById('name').value
    };

    // Gather specific data based on which form is currently rendered
    if (currentType === 'strength') {
        exerciseData.sets = parseInt(document.getElementById('sets').value);
        exerciseData.reps = parseInt(document.getElementById('reps').value);
        exerciseData.weight_kg = parseFloat(document.getElementById('weight').value);
    } else if (currentType === 'cardio') {
        exerciseData.duration_minutes = parseInt(document.getElementById('duration').value);
        exerciseData.distance_km = parseFloat(document.getElementById('distance').value);
    }

    try {
        // Send the JSON data to your Express backend
        const response = await fetch('http://localhost:3000/api/exercises', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(exerciseData)
        });

        if (response.ok) {
            const result = await response.json();
            console.log('Success:', result);
            alert('Exercise saved successfully!');
            // You can also add code here to dynamically update the UI to show the new exercise
            workoutForm.reset(); 
        } else {
            console.error('Failed to save exercise');
        }
    } catch (error) {
        console.error('Error connecting to the API:', error);
    }
});
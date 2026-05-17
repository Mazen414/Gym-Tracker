// Toggle between Login and Register screens
function toggleAuth() {
    const loginSec = document.getElementById('login-section');
    const regSec = document.getElementById('register-section');
    if (loginSec.style.display === 'none') {
        loginSec.style.display = 'block';
        regSec.style.display = 'none';
    } else {
        loginSec.style.display = 'none';
        regSec.style.display = 'block';
    }
}

// Handle Registration
document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Account created! You can now log in.');
            document.getElementById('register-form').reset();
            toggleAuth(); // Flip back to the login screen
        } else {
            alert(data.error || 'Registration failed');
        }
    } catch (err) {
        console.error(err);
    }
});

// Handle Login
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            // THE MOST IMPORTANT PART: Save the VIP wristband to the browser!
            localStorage.setItem('gym_token', data.token);
            localStorage.setItem('gym_username', data.username);
            
            // Redirect to the main dashboard
            window.location.href = 'index.html';
        } else {
            alert(data.error || 'Invalid credentials');
        }
    } catch (err) {
        console.error(err);
    }
});
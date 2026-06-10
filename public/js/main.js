document.addEventListener('DOMContentLoaded', () => {
    
    // Check if user is logged in
    fetch('/api/current-user')
        .then(res => res.json())
        .then(data => {
            const loginLink = document.getElementById('loginLink');
            const adminLink = document.getElementById('adminLink');
            const logoutBtn = document.getElementById('logoutBtn');

            if (data.loggedIn) {
                if (loginLink) loginLink.innerText = `Welcome, ${data.user.username}`;
                if (data.user.role === 'admin' && adminLink) {
                    adminLink.style.display = 'inline';
                }
            }

            if (logoutBtn) {
                logoutBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    fetch('/api/logout').then(() => {
                        window.location.href = 'index.html';
                    });
                });
            }
        });

    // Handle Registration Form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('regUsername').value;
            const password = document.getElementById('regPassword').value;
            const role = document.getElementById('regRole').value;

            const res = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, role })
            });
            const data = await res.json();
            
            document.getElementById('regMsg').innerText = data.msg;
            document.getElementById('regMsg').style.color = data.success ? 'green' : 'red';
        });
    }

    // Handle Login Form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('loginUsername').value;
            const password = document.getElementById('loginPassword').value;

            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();
            
            const loginMsg = document.getElementById('loginMsg');
            loginMsg.innerText = data.msg;
            loginMsg.style.color = data.success ? 'green' : 'red';

            if (data.success) {
                setTimeout(() => {
                    window.location.href = data.role === 'admin' ? 'admin.html' : 'index.html';
                }, 1000);
            }
        });
    }
});
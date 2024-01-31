document.addEventListener('DOMContentLoaded', function() {
    const userForm = document.getElementById('loginForm');
    const messageDiv = document.createElement('div');
    userForm.parentNode.insertBefore(messageDiv, userForm.nextSibling);
    const loginButton = document.getElementById('login-btn');

    loginButton.addEventListener('click', function(event) {
        event.preventDefault();

        const formData = new FormData(userForm);
        const data = {
            username: formData.get('user'),
            password: formData.get('password')
        };

        fetch('https://ramenstand.net/app/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Login failed'); // Throw an error if the login was not successful
            }
            return response.json();
        })
        .then(data => {
            localStorage.setItem('token', data.token); // Store the token
            window.location.href = '../../profile/home.html'; // Redirect to the profile page or other page
        })
        .catch(error => {
            messageDiv.textContent = error.message;
            messageDiv.style.color = 'red';
        });
    });
});

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
            password: formData.get('password'),
            totpToken: formData.get('totpToken') // Include the TOTP token in the data sent to the server
        };

        fetch('https://www.ramenstand.net/app/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        })
        .then(response => {
            if (!response.ok) {
                // Parse the error message from the response if possible
                return response.json().then(errData => {
                    throw new Error(errData.message || 'Login failed');
                });
            }
            return response.json();
        })
        .then(data => {
            localStorage.setItem('token', data.token); // Store the token

            if (data.collectionExists) {
                window.location.href = '../profile/home.html'; // Redirect to the profile page
            } else {
                window.location.href = '../profile/processing.html'; // Redirect to the "account is being processed" page
            }
        })
        .catch(error => {
            messageDiv.textContent = error.message;
            messageDiv.style.color = 'red';
        });
    });
});

document.addEventListener('DOMContentLoaded', function() {
    const userForm = document.getElementById('loginForm');
    const messageDiv = document.createElement('div');
    userForm.parentNode.insertBefore(messageDiv, userForm.nextSibling);
    const loginButton = document.getElementById('login-btn');

    loginButton.addEventListener('click', function(event) {
        event.preventDefault();

        const formData = new FormData(userForm);
        const data = {
            user: formData.get('user'),
            pass: formData.get('password')
        };

        fetch('http://localhost:3000/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        })
        .then(result => {
            messageDiv.textContent = result.message;
            messageDiv.style.color = 'green';
        })
        .catch(error => {
            messageDiv.textContent = error.message;
            messageDiv.style.color = 'red';
        });
    });
});

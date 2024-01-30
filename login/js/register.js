document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('regForm');
    const messageDiv = document.createElement('div');
    registerForm.parentNode.insertBefore(messageDiv, registerForm.nextSibling);
    const registerButton = document.getElementById('reg-btn');

    registerButton.addEventListener('click', function(event) {
        event.preventDefault();

        const formData = new FormData(registerForm);
        const data = {
            fullName: formData.get('fullName'),
            email: formData.get('email'),
            username: formData.get('username'),
            password: formData.get('password'),
            confirmPassword: formData.get('confirmPassword')
        };

        if (data.password !== data.confirmPassword) {
            messageDiv.textContent = "Passwords don't match.";
            messageDiv.style.color = 'red';
            return;
        }

        fetch('https://www.ramenstand.net/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        })
        .then(response => {
            if (!response.ok) {
                throw response;
            }
            // Check if the response has a content type of JSON
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return response.json();
            } else {
                // Handle non-JSON response here
                throw new Error('Response is not in JSON format');
            }
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

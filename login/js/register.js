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

        fetch('https://www.ramenstand.net/app/register', {
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
                    throw new Error(errData.message || 'Registration failed');
                });
            }
            return response.json();
        })
        .then(data => {
            if (data.qrCode) {
                const qrModal = document.getElementById('qrModal');
                const qrImage = document.getElementById('qrImage');
                qrImage.src = data.qrCode;
                qrModal.style.display = "block";
        
                const span = document.getElementsByClassName("close")[0];
                span.onclick = function() {
                    qrModal.style.display = "none";
                }
                window.onclick = function(event) {
                    if (event.target === qrModal) {
                        qrModal.style.display = "none";
                    }
                }
                
                // Display a success message
                messageDiv.textContent = "Registration successful!";
                messageDiv.style.color = 'green';
            } else {
                // Handle cases where QR code is not received
                messageDiv.textContent = "Registration successful but failed to generate QR code. Please contact support.";
                messageDiv.style.color = 'orange';
            }
        })
        .catch(error => {
            messageDiv.textContent = error.message;
            messageDiv.style.color = 'red';
            console.error('Error:', error);
        });
    });
});

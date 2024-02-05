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
        .then(response => response.json())
        .then(data => {
            console.log(data);
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
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
    });
});

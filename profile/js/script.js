const token = localStorage.getItem('token'); // Retrieve the token

fetchPasswords(); // Fetch passwords after successful logon

function searchPasswords() {
    const input = document.getElementById('searchInput');
    const filter = input.value.toLowerCase();
    const table = document.getElementById('passwordsTable');
    const tr = table.getElementsByTagName('tr');

    // Loop through all table rows, and hide those who don't match the search query
    for (let i = 0; i < tr.length; i++) {
        let tdWebsite = tr[i].getElementsByTagName('td')[0];
        let tdUsername = tr[i].getElementsByTagName('td')[1];
        if (tdWebsite || tdUsername) {
            const textValueWebsite = tdWebsite.textContent || tdWebsite.innerText;
            const textValueUsername = tdUsername.textContent || tdUsername.innerText;
            if (textValueWebsite.toLowerCase().indexOf(filter) > -1 || textValueUsername.toLowerCase().indexOf(filter) > -1) {
                tr[i].style.display = '';
            } else {
                tr[i].style.display = 'none';
            }
        }      
    }
}


function fetchPasswords() {
    fetch('/app/passwords', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}` // Include the token in the Authorization header
        }
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        }
        throw new Error('Passwords fetch response was not ok.');
    })
    .then(data => insertPasswordsIntoTable(data)) // Insert passwords into the table
    .catch(error => console.error('Error fetching passwords:', error));
}

function insertPasswordsIntoTable(passwords) {
    console.log(passwords)
    const table = document.getElementById('passwordsTable').getElementsByTagName('tbody')[0];
    table.innerHTML = ''; // Clear existing table data

    passwords.forEach(password => {
        let row = table.insertRow();
        let websiteCell = row.insertCell(0);
        let usernameCell = row.insertCell(1);
        let passwordCell = row.insertCell(2);

        websiteCell.textContent = password.website;
        usernameCell.textContent = password.username;

        // Use a data attribute to store the actual password
        passwordCell.innerHTML = `
            <span class="password-masked" id="password-${password._id}" data-actual-password="${password.password}">••••••••</span>
            <button onclick="togglePasswordVisibility('password-${password._id}')" class="toggle-password">Show</button>
        `;
    });
}

function addPassword(event) {
    event.preventDefault(); // Prevent the form from submitting the traditional way
    const website = document.getElementById('websiteInput').value;
    const username = document.getElementById('usernameInput').value;
    const password = document.getElementById('passwordInput').value;

    fetch('/app/passwords', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` // Include the token in the Authorization header
        },
        body: JSON.stringify({
            website,
            username,
            password
        })
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        }
        throw new Error('Response from server was not ok when adding password.');
    })
    .then(data => {
        console.log('Password added:', data);
        fetchPasswords(); // Refresh the list of passwords
    })
    .catch(error => console.error('Error adding password:', error));
}

document.getElementById('addPasswordForm').addEventListener('submit', addPassword);

function togglePasswordVisibility(spanId) {
    const passwordSpan = document.getElementById(spanId);
    if (passwordSpan) {
        const isMasked = passwordSpan.classList.contains('password-masked');
        if (isMasked) {
            // Retrieve the actual password from data-actual-password attribute
            const actualPassword = passwordSpan.getAttribute('data-actual-password');
            passwordSpan.textContent = actualPassword; // Show the actual password
            passwordSpan.nextSibling.textContent = 'Hide'; // Change the button text to 'Hide'
        } else {
            // If it's showing the password, mask it again
            passwordSpan.textContent = '••••••••';
            passwordSpan.nextSibling.textContent = 'Show'; // Change the button text to 'Show'
        }
        // Toggle the 'password-masked' class
        passwordSpan.classList.toggle('password-masked');
    } else {
        console.error('Element not found:', spanId);
    }
}
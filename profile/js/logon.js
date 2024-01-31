const token = localStorage.getItem('token'); // Retrieve the token

fetch('https://ramenstand.net/app/logon', {
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${token}` // Include the token in the Authorization header
    }
})
.then(response => {
    if (response.ok) {
        return response.json();
    }
    throw new Error('Network response was not ok.');
})
.then(data => console.log(data)) // Handle the response data
.catch(error => console.error('Error:', error));
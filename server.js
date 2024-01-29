const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const app = express();

app.use(express.json()); // for parsing application/json

const mongoURI = 'mongodb://localhost:27017/myPass';

app.use(express.static('login'));

// Connect to MongoDB
mongoose.connect(mongoURI).then(() => console.log('Successfully connected to local MongoDB.'))
  .catch(err => console.error('Error connecting to local MongoDB:', err));

// User Schema
const UserSchema = new mongoose.Schema({
    fullName: String,
    email: { type: String, unique: true },
    username: { type: String, unique: true },
    password: String,
});

// User model
const User = mongoose.model('User', UserSchema);

app.post('/register', async (req, res) => {
    try {
        // Check if the user already exists
        const existingUser = await User.findOne({ username: req.body.username });
        if (existingUser) {
            return res.status(400).send({ message: 'User already exists.' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(req.body.password, 10); // 10 is the salt rounds

        const userInfo = {
            email: req.body.email,
            username: req.body.username,
            password: hashedPassword,
        };

        // Create a new user in the 'users' collection
        const user = new User(userInfo);

        try {
            // Save the user in the 'users' collection
            await user.save();

            // Dynamically create a collection named after the user's full name and insert their info
            // Note: Ensure the fullName field is sanitized and validated to prevent injection attacks.            
            const fullNameCollection = mongoose.connection.collection(req.body.fullName.replace(/\s/g, '_'));
            await fullNameCollection.insertOne(userInfo);

            res.status(201).send({ message: 'User registered successfully.' });
        } catch (error) {
            res.status(500).send({ message: error.message });
        }
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});

// Login endpoint
app.post('/login', async (req, res) => {
    try {
        // Find the user by username
        const user = await User.findOne({ username: req.body.username });
        if (!user) {
            return res.status(400).send({ message: 'User not found.' });
        }

        // Compare the hashed password
        bcrypt.compare(req.body.password, user.password, (err, isMatch) => {
            if (err) {
                return res.status(500).send({ message: 'Error checking password.' });
            } else if (!isMatch) {
                return res.status(400).send({ message: 'Incorrect password.' });
            } else {
                // Passwords match
                res.send({ message: 'Login successful.' });
                // You might want to create a session or generate a token here
            }
        });
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

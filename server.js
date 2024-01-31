const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const app = express();

app.use(express.json()); // for parsing application/json

const mongoURI = 'mongodb://localhost:27017/myPass';

const JWT_SECRET = process.env.JWT_SECRET || 'your_development_secret'; // Only use a default in development

const corsOptionsDelegate = (req, callback) => {
  let corsOptions;
  const origin = req.header(`Origin`);
  console.log(`origin`, origin);

  if (origin === `https://www.ramenstand.net`) {
    corsOptions = { origin: true };
    console.log(`cors accepted`);
  } else {
    corsOptions = { origin: false };
    console.log(`cors rejected`);
  }

  callback(null, corsOptions);
};

// Apply CORS middleware
app.use(cors(corsOptionsDelegate));
app.options('*', cors(corsOptionsDelegate));

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.sendStatus(401); // if there isn't any token

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next(); // pass the execution off to whatever request the client intended
    });
};

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

app.post('/app/register', async (req, res) => {
    try {
        // Check if the user already exists
        const existingUser = await User.findOne({ username: req.body.username });
        if (existingUser) {
            return res.status(400).send({ message: 'User already exists.' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(req.body.password, 10); // 10 is the salt rounds

        const user = new User({
            email: req.body.email,
            username: req.body.username,
            password: hashedPassword,
        });

        // Save the user in the 'users' collection
        await user.save();
        res.status(201).send({ message: 'User registered successfully.' });
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});

// Login endpoint
app.post('/app/login', async (req, res) => {
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
                // Passwords match, generate token
                try {
                    const token = jwt.sign(
                        { userId: user._id }, // Payload could include user ID or other identifying info
                        JWT_SECRET,
                        { expiresIn: '1h' } // Token expires in 1 hour
                    );
                    
                    res.status(201).send({ 
                        message: 'Logged in successfully.',
                        token // Send the token to the client
                    });
                } catch (error) {
                    res.status(500).send({ message: 'Error generating token.' });
                }
            }
        });
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});

app.get('/app/logon', authenticateToken, (req, res) => {
    // Only requests with a valid token will reach this point
    res.json({ message: 'You have accessed a protected route'/*, user: req.user */});
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
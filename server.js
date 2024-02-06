const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const crypto = require('crypto');
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
    salt: String,
    twoFactorSecret: String,
    isTwoFactorEnabled: {
        type: Boolean,
        default: false,
    }
});

// User model
const User = mongoose.model('User', UserSchema);

const PasswordSchema = new mongoose.Schema({
    website: String,
    username: String,
    password: String,
    salt: String
});

// Password model

const checkUserCollection = async (fullName) => {
    try {
        // Replace spaces with underscores
        const collectionName = fullName.replace(/\s+/g, '_');

        // List all collections
        const collections = await mongoose.connection.db.listCollections().toArray();
        
        // Check if a collection with the name exists
        const collectionNames = collections.map(col => col.name);
        return collectionNames.includes(collectionName); // Returns true if the collection exists
    } catch (error) {
        console.error('Error checking user collection:', error);
        return false; // If there's an error, assume the collection doesn't exist
    }
};



app.post('/app/register', async (req, res) => {
    try {
        // Check if the user already exists
        const existingUser = await User.findOne({ username: req.body.username });
        if (existingUser) {
            return res.status(400).send({ message: 'User already exists.' });
        }

        const salt = crypto.randomBytes(16).toString('hex');
        const hashedPassword = await bcrypt.hash(req.body.password, 10); // 10 is the salt rounds
        const secret = speakeasy.generateSecret({
            length: 20,
            issuer: 'MyPass', // Your service's name
            name: `MyPass (${req.body.username})` // A label, typically including the user's email or username
        });

        const user = new User({
            fullName: req.body.fullName,
            email: req.body.email,
            username: req.body.username,
            password: hashedPassword,
            salt: salt,
            twoFactorSecret: secret.base32, // Store the 2FA secret
            isTwoFactorEnabled: true, // Enable 2FA by default
        });

        await user.save();

        // Generate QR Code for the secret
        QRCode.toDataURL(secret.otpauth_url, (err, data_url) => {
            if (err) {
                return res.status(500).send({ message: 'Error generating QR Code.' });
            }

            res.status(201).send({ 
                message: 'User registered successfully, you will receive an email when you are processed',
                qrCode: data_url // Send the QR Code data URL to the client
            });
        });
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

        const collectionExists = await checkUserCollection(user.fullName);

        bcrypt.compare(req.body.password, user.password, (err, isMatch) => {
            if (err) {
                return res.status(500).send({ message: 'Error checking password.' });
            } else if (!isMatch) {
                return res.status(400).send({ message: 'Incorrect password.' });
            } else {
                if (user.isTwoFactorEnabled) {
                    const verified = speakeasy.totp.verify({
                        secret: user.twoFactorSecret,
                        encoding: 'base32',
                        token: req.body.totpToken,
                        window: 1 // Allows for a time window in which the code can be accepted (optional)
                    });

                    if (!verified) {
                        return res.status(400).send({ message: 'Invalid 2FA token.' });
                    }
                }
                const key = crypto.pbkdf2Sync(req.body.password, Buffer.from(user.salt, 'hex'), 10000, 32, 'sha256');
                const aesKey = key.toString('hex');
                try {
                    const token = jwt.sign(
                        { userId: user._id, aesKey }, // Include the AES key in the token
                        JWT_SECRET,
                        { expiresIn: '1h' }
                    );
                    
                     res.status(201).send({ 
                        message: 'Logged in successfully.',
                        token, // Send the token to the client
                        collectionExists // Send the collection status
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

app.post('/app/passwords', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).send({ message: 'User not found.' });
        }

        const aesKey = req.user.aesKey;
        const saltP = crypto.randomBytes(16).toString('hex');
        const cipher = crypto.createCipheriv('aes-256-ctr', Buffer.from(aesKey, 'hex'), Buffer.from(saltP, 'hex'));
        let encryptedPassword = cipher.update(req.body.password, 'utf8', 'hex');
        encryptedPassword += cipher.final('hex');

        const collectionName = user.fullName.replace(/\s+/g, '_');
        const UserPassword = mongoose.model(collectionName, PasswordSchema, collectionName);
        
        const password = new UserPassword({
            website: req.body.website,
            username: req.body.username,
            password: encryptedPassword,
            salt: saltP
        });

        const newPassword = await password.save();
        res.status(201).json(newPassword);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});



app.get('/app/passwords', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).send({ message: 'User not found.' });
        }

        const aesKey = req.user.aesKey;
        const collectionName = user.fullName.replace(/\s+/g, '_');
        const UserPassword = mongoose.model(collectionName, PasswordSchema, collectionName);

        const passwords = await UserPassword.find({});

        const decryptedPasswords = passwords.map(passwordEntry => {
            const decipher = crypto.createDecipheriv('aes-256-ctr', Buffer.from(aesKey, 'hex'), Buffer.from(passwordEntry.salt, 'hex'));
            let decryptedPassword = decipher.update(passwordEntry.password, 'hex', 'utf8');
            decryptedPassword += decipher.final('utf8');

            console.log(decryptedPassword)

            return {
                website: passwordEntry.website,
                username: passwordEntry.username,
                password: decryptedPassword
            };
        });

        res.json(decryptedPasswords);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
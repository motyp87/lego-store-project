const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const { MongoClient } = require('mongodb');
const path = require('path');

const app = express();

// Middleware
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session setup
app.use(session({
    secret: 'lego-store-secret',
    resave: false,
    saveUninitialized: false
}));

// MongoDB Connection
const uri = 'mongodb://motyp87_db_user:7zlUqtPS16L3RzvV@ac-ddqt2mx-shard-00-00.fqpc24x.mongodb.net:27017,ac-ddqt2mx-shard-00-01.fqpc24x.mongodb.net:27017,ac-ddqt2mx-shard-00-02.fqpc24x.mongodb.net:27017/?ssl=true&replicaSet=atlas-13ddk2-shard-0&authSource=admin&appName=Cluster0';
const client = new MongoClient(uri);
let db;

async function connectDB() {
    try {
        await client.connect();
        db = client.db('lego_store');
        console.log("Connected to MongoDB Atlas");
    } catch(err) {
        console.log("DB Connection Error:", err);
    }
}
connectDB();

// --- API ROUTES ---

// Register
app.post('/api/register', async (req, res) => {
    const { username, password, role } = req.body;
    const usersCollection = db.collection('users');

    const existingUser = await usersCollection.findOne({ username });
    if(existingUser) {
        return res.json({ success: false, msg: "Username already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await usersCollection.insertOne({ 
        username, 
        password: hashedPassword, 
        role 
    });
    
    res.json({ success: true, msg: "Registration successful! You can now login." });
});

// Login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const usersCollection = db.collection('users');

    const user = await usersCollection.findOne({ username });
    if(!user) {
        return res.json({ success: false, msg: "User not found" });
    }

    const match = await bcrypt.compare(password, user.password);
    if(match) {
        req.session.user = { username: user.username, role: user.role };
        res.json({ success: true, msg: "Logged in successfully", role: user.role });
    } else {
        res.json({ success: false, msg: "Incorrect password" });
    }
});

// Check Current User (used by frontend to update UI)
app.get('/api/current-user', (req, res) => {
    if(req.session.user) {
        res.json({ loggedIn: true, user: req.session.user });
    } else {
        res.json({ loggedIn: false });
    }
});

// Logout
app.get('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
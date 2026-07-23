const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const { MongoClient, ObjectId } = require('mongodb');
const path = require('path');

const app = express();

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: 'lego-store-secret',
    resave: false,
    saveUninitialized: false
}));

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

// --- AUTHENTICATION ---

app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    const users = db.collection('users');
    if(await users.findOne({ username })) {
        return res.json({ success: false, msg: "Username already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    // Force role to 'user' for all new registrations
    await users.insertOne({ username, password: hashedPassword, role: 'user' });
    res.json({ success: true, msg: "Registration successful!" });
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await db.collection('users').findOne({ username });
    if(user && await bcrypt.compare(password, user.password)) {
        req.session.user = { username: user.username, role: user.role };
        res.json({ success: true, msg: "Logged in successfully", role: user.role });
    } else {
        res.json({ success: false, msg: "Invalid credentials" });
    }
});

app.get('/api/current-user', (req, res) => {
    res.json(req.session.user ? { loggedIn: true, user: req.session.user } : { loggedIn: false });
});

app.get('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// --- CRUD PRODUCTS ---

app.post('/api/products', async (req, res) => {
    if(!req.session.user || req.session.user.role !== 'admin') return res.status(403).json({msg: "Unauthorized"});
    const { name, setNumber, pieces, price } = req.body;
    await db.collection('products').insertOne({ name, setNumber, pieces: Number(pieces), price: Number(price) });
    res.json({ success: true });
});

app.get('/api/products', async (req, res) => {
    const sortBy = req.query.sort || 'name';
    const order = req.query.order === 'desc' ? -1 : 1;
    const products = await db.collection('products').find().sort({ [sortBy]: order }).toArray();
    res.json(products);
});

app.put('/api/products/:id', async (req, res) => {
    if(!req.session.user || req.session.user.role !== 'admin') return res.status(403).json({msg: "Unauthorized"});
    const { name, setNumber, pieces, price } = req.body;
    await db.collection('products').updateOne(
        { _id: new ObjectId(req.params.id) }, 
        { $set: { name, setNumber, pieces: Number(pieces), price: Number(price) } }
    );
    res.json({ success: true });
});

app.delete('/api/products/:id', async (req, res) => {
    if(!req.session.user || req.session.user.role !== 'admin') return res.status(403).json({msg: "Unauthorized"});
    await db.collection('products').deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ success: true });
});

// --- AGGREGATIONS ---

app.get('/api/stats/overview', async (req, res) => {
    const pipeline = [
        { $group: { _id: null, avgPrice: { $avg: "$price" }, totalPieces: { $sum: "$pieces" }, count: { $sum: 1 } } }
    ];
    const stats = await db.collection('products').aggregate(pipeline).toArray();
    res.json(stats[0] || { avgPrice: 0, totalPieces: 0, count: 0 });
});

app.get('/api/stats/categories', async (req, res) => {
    const pipeline = [
        { $project: { category: { $cond: [{ $gte: ["$price", 500] }, "Premium (500+)", "Standard"] } } },
        { $group: { _id: "$category", count: { $sum: 1 } } }
    ];
    const stats = await db.collection('products').aggregate(pipeline).toArray();
    res.json(stats);
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
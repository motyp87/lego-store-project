const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');

const uri = 'mongodb://motyp87_db_user:7zlUqtPS16L3RzvV@ac-ddqt2mx-shard-00-00.fqpc24x.mongodb.net:27017,ac-ddqt2mx-shard-00-01.fqpc24x.mongodb.net:27017,ac-ddqt2mx-shard-00-02.fqpc24x.mongodb.net:27017/?ssl=true&replicaSet=atlas-13ddk2-shard-0&authSource=admin&appName=Cluster0';
const client = new MongoClient(uri);

async function seedDatabase() {
    try {
        await client.connect();
        const db = client.db('lego_store');
        console.log("Connected to database. Starting seed process...");

        // Clear existing data
        await db.collection('users').deleteMany({});
        await db.collection('products').deleteMany({});
        console.log("Old data cleared.");

        // Create users
        const adminPassword = await bcrypt.hash('123456', 10);
        const userPassword = await bcrypt.hash('123456', 10);

        await db.collection('users').insertMany([
            { username: 'moti', password: adminPassword, role: 'admin' },
            { username: 'sara', password: userPassword, role: 'user' }
        ]);
        console.log("Users 'moti' (admin) and 'sara' (user) created.");

        // Generate 100 products
        const products = [];
        for (let i = 1; i <= 100; i++) {
            products.push({
                name: `Lego Collection Set ${i}`,
                pieces: Math.floor(Math.random() * 2000) + 100, // Random pieces between 100-2100
                price: Math.floor(Math.random() * 800) + 100    // Random price between 100-900 ILS
            });
        }
        await db.collection('products').insertMany(products);
        console.log("100 products generated successfully.");

        console.log("Seed complete! You can now start the server.");
    } catch (err) {
        console.error("Error seeding database:", err);
    } finally {
        await client.close();
    }
}

seedDatabase();
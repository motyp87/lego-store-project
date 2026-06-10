const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');

const uri = 'mongodb://motyp87_db_user:7zlUqtPS16L3RzvV@ac-ddqt2mx-shard-00-00.fqpc24x.mongodb.net:27017,ac-ddqt2mx-shard-00-01.fqpc24x.mongodb.net:27017,ac-ddqt2mx-shard-00-02.fqpc24x.mongodb.net:27017/?ssl=true&replicaSet=atlas-13ddk2-shard-0&authSource=admin&appName=Cluster0';
const client = new MongoClient(uri);

async function seedDatabase() {
    try {
        await client.connect();
        const db = client.db('lego_store');
        console.log("Connected to database. Starting seed process...");

        await db.collection('users').deleteMany({});
        await db.collection('products').deleteMany({});
        console.log("Old data cleared.");

        const adminPassword = await bcrypt.hash('123456', 10);
        const userPassword = await bcrypt.hash('123456', 10);

        await db.collection('users').insertMany([
            { username: 'moti', password: adminPassword, role: 'admin' },
            { username: 'sara', password: userPassword, role: 'user' }
        ]);
        console.log("Users created.");

        // 100 Real LEGO Sets with accurate Set Numbers!
        const products = [
            // Star Wars
            { name: "Millennium Falcon", setNumber: "75192", pieces: 7541, price: 3400 },
            { name: "Death Star", setNumber: "75159", pieces: 4016, price: 2200 },
            { name: "AT-AT", setNumber: "75313", pieces: 6785, price: 3100 },
            { name: "Imperial Star Destroyer", setNumber: "75252", pieces: 4784, price: 2800 },
            { name: "Razor Crest", setNumber: "75331", pieces: 6187, price: 2500 },
            { name: "R2-D2", setNumber: "75308", pieces: 2314, price: 850 },
            { name: "X-Wing Starfighter", setNumber: "75355", pieces: 1949, price: 950 },
            { name: "Mos Eisley Cantina", setNumber: "75290", pieces: 3187, price: 1600 },
            { name: "Republic Gunship", setNumber: "75309", pieces: 3292, price: 1500 },
            { name: "Boba Fett's Starship", setNumber: "75312", pieces: 593, price: 250 },
            // Harry Potter
            { name: "Hogwarts Castle", setNumber: "71043", pieces: 6020, price: 1900 },
            { name: "Diagon Alley", setNumber: "75978", pieces: 5544, price: 1800 },
            { name: "Hogwarts Express", setNumber: "76405", pieces: 5129, price: 2000 },
            { name: "Hogwarts Icons", setNumber: "76391", pieces: 3010, price: 1200 },
            { name: "Chamber of Secrets", setNumber: "76389", pieces: 1176, price: 650 },
            { name: "Astronomy Tower", setNumber: "75969", pieces: 971, price: 450 },
            { name: "Attack on the Burrow", setNumber: "75980", pieces: 1047, price: 480 },
            { name: "Ministry of Magic", setNumber: "76403", pieces: 990, price: 450 },
            { name: "Hogsmeade Village", setNumber: "76388", pieces: 851, price: 400 },
            { name: "Knight Bus", setNumber: "75957", pieces: 403, price: 200 },
            // Technic
            { name: "Bugatti Chiron", setNumber: "42083", pieces: 3599, price: 1700 },
            { name: "Lamborghini Sián", setNumber: "42115", pieces: 3696, price: 1800 },
            { name: "Ferrari Daytona SP3", setNumber: "42143", pieces: 3778, price: 1850 },
            { name: "Porsche 911 GT3 RS", setNumber: "42056", pieces: 2704, price: 1500 },
            { name: "Land Rover Defender", setNumber: "42110", pieces: 2573, price: 900 },
            { name: "App-Controlled Cat D11", setNumber: "42131", pieces: 3854, price: 2000 },
            { name: "Liebherr R 9800", setNumber: "42100", pieces: 4108, price: 2100 },
            { name: "Rough Terrain Crane", setNumber: "42082", pieces: 4057, price: 1300 },
            { name: "BMW M 1000 RR", setNumber: "42130", pieces: 1920, price: 1100 },
            { name: "Ducati Panigale V4 R", setNumber: "42107", pieces: 646, price: 350 },
            // Icons / Creator Expert
            { name: "Colosseum", setNumber: "10276", pieces: 9036, price: 2500 },
            { name: "Titanic", setNumber: "10294", pieces: 9090, price: 2800 },
            { name: "Eiffel Tower", setNumber: "10307", pieces: 10001, price: 2900 },
            { name: "Taj Mahal", setNumber: "10256", pieces: 5923, price: 1700 },
            { name: "Roller Coaster", setNumber: "10261", pieces: 4124, price: 1800 },
            { name: "Ferris Wheel", setNumber: "10247", pieces: 2464, price: 950 },
            { name: "Carousel", setNumber: "10257", pieces: 2670, price: 1000 },
            { name: "Assembly Square", setNumber: "10255", pieces: 4002, price: 1300 },
            { name: "Boutique Hotel", setNumber: "10297", pieces: 3066, price: 1100 },
            { name: "Police Station", setNumber: "10278", pieces: 2923, price: 950 },
            // Architecture
            { name: "Statue of Liberty", setNumber: "21042", pieces: 1685, price: 550 },
            { name: "Empire State Building", setNumber: "21046", pieces: 1767, price: 600 },
            { name: "White House", setNumber: "21054", pieces: 1483, price: 500 },
            { name: "London Skyline", setNumber: "21034", pieces: 468, price: 200 },
            { name: "Paris Skyline", setNumber: "21044", pieces: 649, price: 250 },
            { name: "New York Skyline", setNumber: "21028", pieces: 598, price: 280 },
            { name: "Tokyo Skyline", setNumber: "21051", pieces: 547, price: 280 },
            { name: "Singapore Skyline", setNumber: "21057", pieces: 827, price: 300 },
            { name: "Great Pyramid of Giza", setNumber: "21058", pieces: 1476, price: 650 },
            { name: "Trafalgar Square", setNumber: "21045", pieces: 1197, price: 400 },
            // Ideas
            { name: "Tree House", setNumber: "21318", pieces: 3036, price: 1100 },
            { name: "NASA Apollo Saturn V", setNumber: "92176", pieces: 1969, price: 600 },
            { name: "Central Perk", setNumber: "21319", pieces: 1070, price: 300 },
            { name: "Typewriter", setNumber: "21327", pieces: 2079, price: 900 },
            { name: "Home Alone", setNumber: "21330", pieces: 3955, price: 1200 },
            { name: "Grand Piano", setNumber: "21323", pieces: 3662, price: 1600 },
            { name: "Blacksmith", setNumber: "21325", pieces: 2164, price: 750 },
            { name: "Sonic the Hedgehog", setNumber: "21331", pieces: 1125, price: 350 },
            { name: "Ship in a Bottle", setNumber: "92177", pieces: 962, price: 350 },
            { name: "Vincent van Gogh", setNumber: "21333", pieces: 2316, price: 850 },
            // Marvel
            { name: "Daily Bugle", setNumber: "76178", pieces: 3772, price: 1500 },
            { name: "Sanctum Sanctorum", setNumber: "76218", pieces: 2708, price: 1100 },
            { name: "Avengers Tower", setNumber: "76269", pieces: 5201, price: 2100 },
            { name: "Hulkbuster", setNumber: "76210", pieces: 4049, price: 2200 },
            { name: "Infinity Gauntlet", setNumber: "76191", pieces: 590, price: 350 },
            { name: "Nano Gauntlet", setNumber: "76223", pieces: 675, price: 350 },
            { name: "Guardians' Ship", setNumber: "76193", pieces: 1901, price: 700 },
            { name: "Thor's Hammer", setNumber: "76209", pieces: 979, price: 500 },
            { name: "Spider-Man at Sanctum", setNumber: "76185", pieces: 355, price: 200 },
            { name: "Iron Man Armory", setNumber: "76216", pieces: 496, price: 450 },
            // Ninjago & City
            { name: "Ninjago City Gardens", setNumber: "71741", pieces: 5685, price: 1400 },
            { name: "Ninjago City", setNumber: "70620", pieces: 4867, price: 1500 },
            { name: "Destiny's Bounty", setNumber: "71705", pieces: 1781, price: 750 },
            { name: "Temple of Airjitzu", setNumber: "70751", pieces: 2028, price: 900 },
            { name: "Water Dragon", setNumber: "71754", pieces: 737, price: 350 },
            { name: "City Police Station", setNumber: "60246", pieces: 743, price: 300 },
            { name: "City Fire Station", setNumber: "60320", pieces: 540, price: 280 },
            { name: "Passenger Train", setNumber: "60197", pieces: 677, price: 750 },
            { name: "Freight Train", setNumber: "60198", pieces: 1226, price: 850 },
            { name: "Town Center", setNumber: "60292", pieces: 790, price: 450 },
            // Classic
            { name: "Large Creative Brick Box", setNumber: "10698", pieces: 790, price: 250 },
            { name: "Medium Creative Brick Box", setNumber: "10696", pieces: 484, price: 150 },
            { name: "Bricks and Animals", setNumber: "11011", pieces: 1500, price: 300 },
            { name: "Creative Ocean Fun", setNumber: "11018", pieces: 333, price: 100 },
            { name: "Creative Monsters", setNumber: "11017", pieces: 140, price: 50 },
            { name: "Creative Neon Fun", setNumber: "11027", pieces: 333, price: 100 },
            { name: "Space Mission", setNumber: "11022", pieces: 1700, price: 500 },
            { name: "Around the World", setNumber: "11015", pieces: 950, price: 250 },
            { name: "Creative Party Box", setNumber: "11029", pieces: 900, price: 250 },
            { name: "World Map", setNumber: "31203", pieces: 11695, price: 1100 }
        ];

        await db.collection('products').insertMany(products);
        console.log("100 realistic products generated successfully.");
        console.log("Seed complete! You can now start the server.");
    } catch (err) {
        console.error("Error seeding database:", err);
    } finally {
        await client.close();
    }
}

seedDatabase();
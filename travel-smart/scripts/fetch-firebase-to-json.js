const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Initialize Firebase Admin
let serviceAccount;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
  const keyPath = path.join(__dirname, '../serviceAccountKey.json');
  if (fs.existsSync(keyPath)) {
    serviceAccount = require(keyPath);
  } else {
    console.error('Error: serviceAccountKey.json not found and FIREBASE_SERVICE_ACCOUNT env var not set');
    process.exit(1);
  }
}

if (!process.env.FIREBASE_DATABASE_URL) {
  console.error('Error: FIREBASE_DATABASE_URL environment variable is not set');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL
});

const db = admin.database();

async function fetchAndSave() {
  try {
    // Fetch travel-lessons
    const lessonsSnap = await db.ref('travel-lessons').once('value');
    const lessons = lessonsSnap.val();
    fs.writeFileSync(path.join(__dirname, '../mydb/travel-lessons.json'), JSON.stringify(lessons, null, 2), 'utf8');
    console.log('travel-lessons saved to mydb/travel-lessons.json');

    // Fetch travel-users
    const usersSnap = await db.ref('travel-users').once('value');
    const users = usersSnap.val();
    fs.writeFileSync(path.join(__dirname, '../mydb/travel-users.json'), JSON.stringify(users, null, 2), 'utf8');
    console.log('travel-users saved to mydb/travel-users.json');
  } catch (err) {
    console.error('Error fetching or saving data:', err);
  } finally {
    admin.app().delete();
  }
}

fetchAndSave();

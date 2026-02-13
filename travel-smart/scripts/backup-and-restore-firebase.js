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

async function backupAndRestore() {
  try {
    // Backup travel-lessons and travel-users
    const lessonsSnap = await db.ref('travel-lessons').once('value');
    const lessons = lessonsSnap.val();
    if (lessons) {
      await db.ref('travel-lessons-bkp').set(lessons);
      console.log('travel-lessons backed up to travel-lessons-bkp');
    }
    const usersSnap = await db.ref('travel-users').once('value');
    const users = usersSnap.val();
    if (users) {
      await db.ref('travel-users-bkp').set(users);
      console.log('travel-users backed up to travel-users-bkp');
    }

    // Restore from local JSON files
    const lessonsJsonPath = path.join(__dirname, '../mydb/travel-lessons.json');
    const usersJsonPath = path.join(__dirname, '../mydb/travel-users.json');
    if (fs.existsSync(lessonsJsonPath)) {
      const lessonsData = JSON.parse(fs.readFileSync(lessonsJsonPath, 'utf8'));
      await db.ref('travel-lessons').set(lessonsData);
      console.log('travel-lessons restored from travel-lessons.json');
    } else {
      console.warn('travel-lessons.json not found, skipping restore.');
    }
    if (fs.existsSync(usersJsonPath)) {
      const usersData = JSON.parse(fs.readFileSync(usersJsonPath, 'utf8'));
      await db.ref('travel-users').set(usersData);
      console.log('travel-users restored from travel-users.json');
    } else {
      console.warn('travel-users.json not found, skipping restore.');
    }
  } catch (err) {
    console.error('Error during backup or restore:', err);
  } finally {
    admin.app().delete();
  }
}

backupAndRestore();

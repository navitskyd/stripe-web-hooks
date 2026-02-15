const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Initialize Firebase Admin
let serviceAccount;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
  const keyPath = path.join(__dirname, '../../serviceAccountKey.json');
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

    // Restore from latest JSON files in firebase folder
    const firebaseDir = path.join(__dirname, '../firebase');
    let lessonsFile = null, usersFile = null;
    if (fs.existsSync(firebaseDir)) {
      const files = fs.readdirSync(firebaseDir);
      // Find latest travel-lessons_*.json
      const lessonsFiles = files.filter(f => f.startsWith('travel-lessons_') && f.endsWith('.json'));
      if (lessonsFiles.length) {
        lessonsFile = lessonsFiles.sort().reverse()[0];
      }
      // Find latest travel-users_*.json
      const usersFiles = files.filter(f => f.startsWith('travel-users_') && f.endsWith('.json'));
      if (usersFiles.length) {
        usersFile = usersFiles.sort().reverse()[0];
      }
    }
    if (lessonsFile) {
      const lessonsPath = path.join(firebaseDir, lessonsFile);
      const lessonsData = JSON.parse(fs.readFileSync(lessonsPath, 'utf8'));
      await db.ref('travel-lessons').set(lessonsData);
      console.log(`travel-lessons restored from ${lessonsFile}`);
    } else {
      console.warn('No travel-lessons_*.json found, skipping restore.');
    }
    if (usersFile) {
      const usersPath = path.join(firebaseDir, usersFile);
      const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
      await db.ref('travel-users').set(usersData);
      console.log(`travel-users restored from ${usersFile}`);
    } else {
      console.warn('No travel-users_*.json found, skipping restore.');
    }
  } catch (err) {
    console.error('Error during backup or restore:', err);
  } finally {
    admin.app().delete();
  }
}

backupAndRestore();

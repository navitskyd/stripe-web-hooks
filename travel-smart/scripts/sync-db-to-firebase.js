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
  console.error('Set it with: export FIREBASE_DATABASE_URL="https://your-project.firebaseio.com"');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL
});

const db = admin.database();
const mydbPath = path.join(__dirname, '../mydb');

/**
 * Parse lessons.db and extract data using videoId as key
 * Expected columns in order: videoId, title, topic, streams, tags
 * Returns: { data: lessons, topicOrder: [] }
 */
function parseLessonsDB(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        reject(err);
        return;
      }

      const lines = data.trim().split('\n');
      if (lines.length === 0) {
        resolve({ data: {}, topicOrder: [] });
        return;
      }

      // Column names in order (no header line in file)
      const columnNames = ['videoId', 'title', 'topic', 'streams', 'tags'];
      const result = {};
      const topicOrder = [];

      // Parse all lines (no header)
      for (let i = 0; i < lines.length; i++) {
        const values = lines[i].split('|').map(v => v.trim());
        const videoId = values[0];

        if (!videoId) {
          console.warn(`Skipping row ${i + 1}: missing videoId`);
          continue;
        }

        const topic = values[2] || 'uncategorized';
        
        // Track topic order as we encounter them
        if (!topicOrder.includes(topic) && !result[topic]) {
          topicOrder.push(topic);
        }

        const obj = {};
        columnNames.forEach((columnName, index) => {
          if (columnName !== 'videoId') {
            obj[columnName] = values[index] || null;
          }
        });

        result[videoId] = obj;
      }

      resolve({ data: result, topicOrder });
    });
  });
}

/**
 * Main sync function - processes only lessons.db
 */
async function syncDBToFirebase() {
  try {
    console.log('Starting lessons.db sync to Firebase...');

    // Check if mydb folder exists
    if (!fs.existsSync(mydbPath)) {
      console.log(`mydb folder not found at ${mydbPath}`);
      process.exit(1);
    }

    // Check for lessons.db specifically
    const lessonsDbPath = path.join(mydbPath, 'lessons.db');
    if (!fs.existsSync(lessonsDbPath)) {
      console.error('Error: lessons.db not found in mydb folder');
      process.exit(1);
    }

    console.log('Parsing lessons.db...');

    try {
      const parsedData = await parseLessonsDB(lessonsDbPath);
      console.log(`✓ Successfully parsed ${Object.keys(parsedData).length} lessons`);

      // Group lessons by topic, preserving the order topics appear in the file
      const topicOrder = [];
      const lessonsByTopic = {};
      
      Object.keys(parsedData).forEach(videoId => {
        const lesson = parsedData[videoId];
        const topic = lesson.topic || 'uncategorized';
        
        // Track topic order
        if (!lessonsByTopic[topic]) {
          topicOrder.push(topic);
          lessonsByTopic[topic] = {};
        }
        lessonsByTopic[topic][videoId] = lesson;
      });

      // Rebuild object with numbered topics and lessons grouped under "lessons" key
      const numberedTopics = {};
      topicOrder.forEach((topic, index) => {
        const topicNumber = index + 1;
        const topicKey = `${topicNumber} ${topic}`;
        numberedTopics[topicKey] = {
          lessons: lessonsByTopic[topic]
        };
      });

      console.log(`Grouped into ${topicOrder.length} topic(s): ${topicOrder.join(', ')}`);

      // Upload to Firebase under travel-data/lessons
      console.log('Uploading to Firebase Realtime Database under travel-data/lessons...');
      await db.ref('travel-data/lessons').set(numberedTopics);
      console.log('✓ Successfully synced all lessons to Firebase');

    } catch (error) {
      console.error(`✗ Error parsing lessons.db:`, error.message);
      process.exit(1);
    }

  } catch (error) {
    console.error('Error during sync:', error);
    process.exit(1);
  } finally {
    admin.app().delete();
  }
}

// Run the sync
syncDBToFirebase();

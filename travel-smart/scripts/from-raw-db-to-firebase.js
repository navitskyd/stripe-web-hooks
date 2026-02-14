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
  console.log(keyPath);
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
 * Parse sections.db and extract topic titles
 * Expected columns in order: topic, title
 * Returns: { topic: title }
 */
function parseSectionsDB(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        reject(err);
        return;
      }

      const lines = data.trim().split('\n');
      if (lines.length === 0) {
        resolve({});
        return;
      }

      const result = {};

      // Parse all lines (no header)
      for (let i = 0; i < lines.length; i++) {
        const values = lines[i].split('|').map(v => v.trim());
        const topic = values[0];
        const title = values[1];

        if (topic && title) {
          result[topic] = title;
        }
      }

      resolve(result);
    });
  });
}

/**
 * Parse users.db and extract data using email as key
 * Expected columns in order: email, stream, tags
 * Returns: { email: {stream, tags} }
 */
function parseUsersDB(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        reject(err);
        return;
      }

      const lines = data.trim().split('\n');
      if (lines.length === 0) {
        resolve({});
        return;
      }

      const result = {};

      // Parse all lines (no header)
      for (let i = 0; i < lines.length; i++) {
        const values = lines[i].split('|').map(v => v.trim());
        const email = values[0];
        const stream = values[1];
        const tags = values[2];

        if (email) {
          // Encode email to make it Firebase-safe (replace . with ,)
          const encodedEmail = email.replace(/\./g, ',');
          result[encodedEmail] = {
            email: email,
            stream: stream || null,
            tags: tags || null
          };
        }
      }

      resolve(result);
    });
  });
}

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
        if (!topicOrder.includes(topic)) {
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
 * Main sync function - processes lessons.db and sections.db
 */
async function syncDBToFirebase() {
  try {
    console.log('Starting database sync...');

    // Check if mydb folder exists
    if (!fs.existsSync(mydbPath)) {
      console.log(`mydb folder not found at ${mydbPath}`);
      process.exit(1);
    }

    // Check for lessons.db, sections.db, and users.db
    const lessonsDbPath = path.join(mydbPath, 'lessons.db');
    const sectionsDbPath = path.join(mydbPath, 'sections.db');
    const usersDbPath = path.join(mydbPath, 'users.db');
    
    if (!fs.existsSync(lessonsDbPath)) {
      console.error('Error: lessons.db not found in mydb folder');
      process.exit(1);
    }

    if (!fs.existsSync(sectionsDbPath)) {
      console.error('Error: sections.db not found in mydb folder');
      process.exit(1);
    }

    if (!fs.existsSync(usersDbPath)) {
      console.error('Error: users.db not found in mydb folder');
      process.exit(1);
    }

    console.log('Parsing sections.db...');
    const topicTitles = await parseSectionsDB(sectionsDbPath);
    console.log(`✓ Successfully parsed ${Object.keys(topicTitles).length} topic titles`);

    console.log('Parsing users.db...');
    const users = await parseUsersDB(usersDbPath);
    console.log(`✓ Successfully parsed ${Object.keys(users).length} users`);

    console.log('Parsing lessons.db...');

    try {
      const parsedData = await parseLessonsDB(lessonsDbPath);
      console.log(`✓ Successfully parsed ${Object.keys(parsedData.data).length} lessons`);

      // Group lessons by topic, preserving the order topics appear in the file
      const topicOrder = parsedData.topicOrder;
      const lessonsByTopic = {};
      
      Object.keys(parsedData.data).forEach(videoId => {
        const lesson = parsedData.data[videoId];
        const topic = lesson.topic || 'uncategorized';
        
        if (!lessonsByTopic[topic]) {
          lessonsByTopic[topic] = {};
        }
        lessonsByTopic[topic][videoId] = lesson;
      });

      // Rebuild object in topic order and enrich with topic titles
      const orderedLessonsByTopic = {};
      topicOrder.forEach(topic => {
        orderedLessonsByTopic[topic] = {
          title: topicTitles[topic] || topic,
          lessons: lessonsByTopic[topic]
        };
      });

      // Output grouped lessons to console
      console.log('\n=== LESSONS GROUPED BY TOPIC (in file order, enriched with titles) ===');
      console.log(JSON.stringify(orderedLessonsByTopic, null, 2));
      console.log('\n✓ Parsing complete');


      // Save to Firebase (update only, keep history)
      console.log('Uploading lessons to Firebase Realtime Database under travel-lessons (update only, keep history)...');
      for (const topic of Object.keys(orderedLessonsByTopic)) {
        const lessons = orderedLessonsByTopic[topic].lessons || {};
        for (const videoId of Object.keys(lessons)) {
          const lessonRef = db.ref(`travel-lessons/${topic}/lessons/${videoId}`);
          const newLesson = lessons[videoId];
          // Fetch current node
          const snap = await lessonRef.once('value');
          const current = snap.val();
          let history = Array.isArray(current?.history) ? current.history : [];
          let shouldSaveHistory = false;
          if (current) {
            // Remove history from current before comparing
            const { history: _, ...rest } = current;
            // Compare newLesson and rest (ignoring history)
            const keys = new Set([...Object.keys(rest), ...Object.keys(newLesson)]);
            for (const k of keys) {
              if (rest[k] !== newLesson[k]) {
                shouldSaveHistory = true;
                break;
              }
            }
            if (shouldSaveHistory) {
              history.unshift(rest);
              if (history.length > 5) history = history.slice(0, 5);
            }
          }
          // Only update history if changed, otherwise keep as is
          await lessonRef.update({ ...newLesson, history });
        }
        // Also update topic title if changed
        const topicTitleRef = db.ref(`travel-lessons/${topic}/title`);
        await topicTitleRef.set(orderedLessonsByTopic[topic].title);
      }
      console.log('✓ Successfully updated lessons in Firebase');

      console.log('Uploading users to Firebase Realtime Database under travel-users (update only, keep history)...');
      for (const encodedEmail of Object.keys(users)) {
        const userRef = db.ref(`travel-users/${encodedEmail}`);
        const newUser = users[encodedEmail];
        // Fetch current node
        const snap = await userRef.once('value');
        const current = snap.val();
        let history = Array.isArray(current?.history) ? current.history : [];
        let shouldSaveHistory = false;
        if (current) {
          // Remove history from current before comparing
          const { history: _, ...rest } = current;
          // Compare newUser and rest (ignoring history)
          const keys = new Set([...Object.keys(rest), ...Object.keys(newUser)]);
          for (const k of keys) {
            if (rest[k] !== newUser[k]) {
              shouldSaveHistory = true;
              break;
            }
          }
          if (shouldSaveHistory) {
            history.unshift(rest);
            if (history.length > 5) history = history.slice(0, 5);
          }
        }
        // Only update history if changed, otherwise keep as is
        await userRef.update({ ...newUser, history });
      }
      console.log('✓ Successfully updated users in Firebase');

    } catch (error) {
      console.error(`✗ Error parsing:`, error.message);
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

const {admin,getRef, db,fs, path} = require('../../src/utils/common')

async function fetchAndSave() {
  try {
    // Ensure firebase folder exists
    const firebaseDir = path.join(__dirname, 'firebase');
    if (!fs.existsSync(firebaseDir)) {
      fs.mkdirSync(firebaseDir);
    }
    // Get current datetime in human-readable format
    const now = new Date();
    const pad = n => n.toString().padStart(2, '0');
    const datetime = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;

    // Fetch travel-lessons
    const lessonsSnap = await db.ref('travel-lessons').once('value');
    const lessons = lessonsSnap.val();
    const lessonsFile = path.join(firebaseDir, `travel-lessons_${datetime}.json`);
    fs.writeFileSync(lessonsFile, JSON.stringify(lessons, null, 2), 'utf8');
    console.log(`travel-lessons saved to ${lessonsFile}`);

    // Fetch travel-users
    const usersSnap = await db.ref('travel-users').once('value');
    const users = usersSnap.val();
    const usersFile = path.join(firebaseDir, `travel-users_${datetime}.json`);
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2), 'utf8');
    console.log(`travel-users saved to ${usersFile}`);
  } catch (err) {
    console.error('Error fetching or saving data:', err);
  } finally {
    admin.app().delete();
  }
}

fetchAndSave();

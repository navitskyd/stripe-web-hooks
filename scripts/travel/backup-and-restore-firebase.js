require('../../src/utils/common')

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

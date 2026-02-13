import * as fs from 'fs';
import * as path from 'path';
import * as lockfile from 'proper-lockfile';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as admin from 'firebase-admin';
import { sendEmail } from '../utils/email';

const execAsync = promisify(exec);

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  const serviceAccountPath = path.join(__dirname, '../../travel-smart/serviceAccountKey.json');
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL
  });
}

export const handleProduct = async (productId: string, customerEmail: string) => {
  console.log("Вебинар \"Секреты и Лайфхаки: самостоятельные путешествия без переплат\" для " + customerEmail);

  // Update users.db
  const usersDbPath = path.join(__dirname, '../../travel-smart/mydb/users.db');
  let isNewUser = false;
  let generatedPassword = '';
  
  try {
    // Acquire lock on the file
    const release = await lockfile.lock(usersDbPath, {
      retries: {
        retries: 10,
        minTimeout: 100,
        maxTimeout: 2000
      }
    });

    try {
      // Read the file
      const fileContent = fs.readFileSync(usersDbPath, 'utf8');
      const lines = fileContent.trim().split('\n');
      let userFound = false;
      let updatedLines: string[] = [];

      // Process each line
      for (const line of lines) {
        const values = line.split('|');
        const email = values[0]?.trim();
        
        console.log(`Checking line: "${line}"`);
        console.log(`  Email from line: "${email}"`);
        console.log(`  Target email: "${customerEmail}"`);
        console.log(`  Match: ${email === customerEmail}`);
        
        if (email === customerEmail) {
          userFound = true;
          const stream = values[1]?.trim() || '';
          const tags = values[2]?.trim() || '';
          
          console.log(`  Current stream: "${stream}"`);
          console.log(`  Current tags: "${tags}"`);
          
          // Add "webinar" to streams if not already present
          const streamParts = stream ? stream.split(',').map(s => s.trim()) : [];
          if (!streamParts.includes('webinar')) {
            streamParts.push('webinar');
          }
          
          // Add "webinar" to tags if not already present
          const tagParts = tags ? tags.split(',').map(t => t.trim()) : [];
          if (!tagParts.includes('webinar')) {
            tagParts.push('webinar');
          }
          
          // Rebuild the line
          const updatedLine = `${email}|${streamParts.join(',')}|${tagParts.join(',')}`;
          console.log(`  Updated line: "${updatedLine}"`);
          updatedLines.push(updatedLine);
          console.log(`✓ Updated user ${customerEmail} with webinar stream and tag`);
        } else {
          updatedLines.push(line);
        }
      }

      // If user not found, add new entry
      if (!userFound) {
        isNewUser = true;
        updatedLines.push(`${customerEmail}|webinar|webinar`);
        console.log(`Added new user ${customerEmail} with webinar stream and tag`);
      }

      // Write back to file
      fs.writeFileSync(usersDbPath, updatedLines.join('\n') + '\n', 'utf8');
      
    } finally {
      // Release the lock
      await release();
    }
    
    // Sync database to Firebase
    console.log('Syncing database to Firebase...');
    const syncScriptPath = path.join(__dirname, '../../travel-smart/scripts/sync-db-to-firebase.js');
    try {
      const { stdout, stderr } = await execAsync(`node "${syncScriptPath}"`);
      if (stdout) console.log(stdout);
      if (stderr) console.error(stderr);
      console.log('✓ Database synced to Firebase successfully');
    } catch (syncError) {
      console.error('Error syncing database to Firebase:', syncError);
      // Don't throw - user was added successfully even if sync fails
    }

    // Always try to create Firebase Auth user
    // Generate random 6-digit password
    generatedPassword = Math.floor(100000 + Math.random() * 900000).toString();
    let body;
    // Create Firebase Auth user
    try {
      const userRecord = await admin.auth().createUser({
        email: customerEmail,
        password: generatedPassword,
        emailVerified: false
      });
      console.log(`user created ${customerEmail} ${generatedPassword}`);
      body = bodyWithPassword.replace('[EMAIL]', customerEmail).replace('[PASSWORD]', generatedPassword);
    } catch (authError: any) {
      console.log('User exists');
      body = bodyNoPassword.replace('[EMAIL]', customerEmail);
    }
     await sendEmail('Svethappy <svethappy3@gmail.com>', customerEmail, 'Reels Интенсив"', body);
    
  } catch (error) {
    console.error('Error updating users.db:', error);
    throw error;
  }
};

  const bodyWithPassword = `
Здравствуйте!

Благодарим вам за оплату!

Ваши учетные данные для доступа к вебинару 
<a href="https://travel-smart.web.app">Войти</a>
            Логин(емайл): [EMAIL]
            Пароль: [PASSWORD]

      Если у вас возникнут вопросы - вы можете писать на этот имейл либо по всем ТЕХНИЧЕСКИМ моментам пишите в аккаунт https://www.instagram.com/svethappy.mngr/ 

      Благодарим за покупку🫶

      От души, svethappy
             `
  const bodyNoPassword = `
Здравствуйте!

Благодарим вам за оплату!

Ваши учетные данные для доступа к вебинару 
<a href="https://travel-smart.web.app">Войти</a>
            Логин(емайл): [EMAIL]
            Пароль: ваш прежний пароль (у вас уже есть доступ к другим продуктам, поэтому новый пароль не создается, а сохраняется прежний)

      Если у вас возникнут вопросы - вы можете писать на этот имейл либо по всем ТЕХНИЧЕСКИМ моментам пишите в аккаунт https://www.instagram.com/svethappy.mngr/ 

      Благодарим за покупку🫶

      От души, svethappy
             `

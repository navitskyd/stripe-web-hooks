import * as path from 'path';
import * as admin from 'firebase-admin';
import { sendEmail } from '../utils/email';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  const serviceAccountPath = path.join(__dirname, '../../travel-smart/serviceAccountKey.json');
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL
  });
}


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
             `;
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
             `;

export const handleProduct = async (productId: string, customerEmail: string) => {
  console.log("Вебинар \"Секреты и Лайфхаки: самостоятельные путешествия без переплат\" для " + customerEmail);

  let isNewUser = false;
  let generatedPassword = '';
  try {
    // Encode email for Firebase key (replace . with ,)
    const encodedEmail = customerEmail.replace(/\./g, ',');
    const db = admin.database();
    const userRef = db.ref('travel-users').child(encodedEmail);
    const snapshot = await userRef.once('value');
    let userData = snapshot.val();
    let streamParts: string[] = [];
    let tagParts: string[] = [];

    if (userData) {
      // Existing user: update streams and tags
      streamParts = userData.stream ? userData.stream.split(',').map((s: string) => s.trim()) : [];
      tagParts = userData.tags ? userData.tags.split(',').map((t: string) => t.trim()) : [];
      if (!streamParts.includes('webinar')) streamParts.push('webinar');
      if (!tagParts.includes('webinar')) tagParts.push('webinar');
      await userRef.update({
        stream: streamParts.join(','),
        tags: tagParts.join(',')
      });
      console.log(`✓ Updated user ${customerEmail} with webinar stream and tag in Firebase`);
    } else {
      // New user
      isNewUser = true;
      await userRef.set({
        email: customerEmail,
        stream: 'webinar',
        tags: 'webinar'
      });
      console.log(`Added new user ${customerEmail} with webinar stream and tag in Firebase`);
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
    await sendEmail('Школа «Путешествуй сам» <svethappy3@gmail.com>',
        customerEmail,
        'Вебинар "Секреты и Лайфхаки: самостоятельные путешествия без переплат"',
        body);
    
  } catch (error) {
    console.error('Error updating user in Firebase:', error);
    throw error;
  }

};

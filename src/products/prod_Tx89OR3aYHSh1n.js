const { sendEmail,db,admin } = require('../utils/common');

const productTitle = 'Трэвел Курс для новичков "База самостоятельных путешествий"';

const bodyWithPassword = `
Здравствуйте!

Благодарим вам за оплату!

Ваши учетные данные для доступа к вебинару 
<a href="https://travel-smart.web.app">Войти</a>
            Логин(емайл): [EMAIL]
            Пароль: [PASSWORD]

      Если у вас возникнут вопросы - вы можете писать на этот имейл 
      либо по всем ТЕХНИЧЕСКИМ моментам пишите в аккаунт https://www.instagram.com/svethappy.mngr/

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

      Если у вас возникнут вопросы - вы можете писать на этот имейл 
      либо по всем ТЕХНИЧЕСКИМ моментам пишите в аккаунт https://www.instagram.com/svethappy.mngr/

      Благодарим за покупку🫶

      От души, svethappy
`;

async function handleProduct(productId, customerEmail, session) {
    let customFields = session.custom_fields;
    let customerReferenceId = session.client_reference_id || null;
    console.log(productTitle + customerEmail);

  let generatedPassword = '';

  try {
    // Encode email for Firebase key (replace . with ,)
    const encodedEmail = customerEmail.replace(/\./g, ',');
    const userRef = db.ref('travel-users').child(encodedEmail);
    const snapshot = await userRef.once('value');
    const userData = snapshot.val();

    let streamParts = [];
    let tagParts = [];

    if (userData) {
      // Existing user: update streams and tags
      streamParts = userData.stream
          ? userData.stream.split(',').map((s) => s.trim())
          : [];
      tagParts = userData.tags
          ? userData.tags.split(',').map((t) => t.trim())
          : [];

      if (!streamParts.includes('webinar')) streamParts.push('webinar');
      if (!tagParts.includes('webinar')) tagParts.push('webinar');

      await userRef.update({
        stream: streamParts.join(','),
        tags: tagParts.join(','),
      });

      console.log(
          `✓ Updated user ${customerEmail} with webinar stream and tag in Firebase`
      );
    } else {
      // New user
      await userRef.set({
        email: customerEmail,
        stream: 'webinar',
        tags: 'webinar',
      });
      console.log(
          `Added new user ${customerEmail} with webinar stream and tag in Firebase`
      );
    }

    // Generate random 6-digit password
    generatedPassword = Math.floor(100000 + Math.random() * 900000).toString();

    let body;

    // Try to create Firebase Auth user
    try {
      await admin.auth().createUser({
        email: customerEmail,
        password: generatedPassword,
        emailVerified: false,
      });

      console.log(`user created ${customerEmail} ${generatedPassword}`);

      body = bodyWithPassword
      .replace('[EMAIL]', customerEmail)
      .replace('[PASSWORD]', generatedPassword);
    } catch (authError) {
      console.log('User exists ? ' + authError.message);
      body = bodyNoPassword.replace('[EMAIL]', customerEmail);
    }

    await sendEmail(
        'Школа «Путешествуй сам» <svethappy3@gmail.com>',
        customerEmail,
        productTitle,
        body
    );
  } catch (error) {
    console.error('Error updating user in Firebase:', error);
    throw error;
  }
}

module.exports = {
  handleProduct,
};

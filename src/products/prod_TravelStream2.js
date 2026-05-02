// products/prod_travel_smart_webinar.js
const { sendEmail,getRef,admin } = require('../utils/common');
const {createInviteLink} = require("../utils/utils");

const productTitle = 'Курс "Путешествуй сам" для всех уровней, 2 поток';

const bodyWithPassword = `
Здравствуйте!

Благодарим вам за оплату!

Ваши учетные данные для доступа к курсу 
<a href="https://travel-smart.web.app">Войти</a>
            Логин(емайл): [EMAIL]
            Пароль: [PASSWORD]

      ОБЯЗАТЕЛЬНО ВСТУПАЙТЕ в наш <a href="[TG_LINK]">телеграм-канал</a> с новостями и дополнениями. 

      БУДЬТЕ ВНИМАТЕЛЬНЫ - сразу подписывайтесь на канал, т.к. ссылка работает на один вход.
      
      Если у вас возникнут вопросы - вы можете писать на этот имейл 
      либо по всем ТЕХНИЧЕСКИМ моментам пишите в аккаунт https://www.instagram.com/svethappy.mngr/

      Благодарим за покупку🫶

      От души, svethappy
`;

const bodyNoPassword = `
Здравствуйте!

Благодарим вам за оплату!

Ваши учетные данные для доступа к курсу 
<a href="https://travel-smart.web.app">Войти</a>
            Логин(емайл): [EMAIL]
            Пароль: ваш прежний пароль (у вас уже есть доступ к другим продуктам, поэтому новый пароль не создается, а сохраняется прежний)

      ОБЯЗАТЕЛЬНО ВСТУПАЙТЕ в наш <a href="[TG_LINK]">телеграм-канал</a> с новостями и дополнениями. 

      БУДЬТЕ ВНИМАТЕЛЬНЫ - сразу подписывайтесь на канал, т.к. ссылка работает на один вход.
      
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
    const encodedEmail = customerEmail.replace(/\./g, ',');
    const userRef = getRef('travel-users').child(encodedEmail);
    const snapshot = await userRef.once('value');
    const userData = snapshot.val();

    let streamParts = [];

    if (userData) {
      // Existing user: update streams and tags
      streamParts = userData.stream
          ? userData.stream.split(',').map((s) => s.trim())
          : [];

      if (!streamParts.includes('stream2')) streamParts.push('stream2');

      await userRef.update({
        stream: streamParts.join(',')
      });

      console.log(
          `✓ Updated user ${customerEmail} with stream2 stream in Firebase`
      );
    } else {
      // New user
      await userRef.set({
        email: customerEmail,
        stream: 'stream2'
      });
      console.log(
          `Added new user ${customerEmail} with stream2 stream in Firebase`
      );
    }

    // Generate random 6-digit password
    generatedPassword = Math.floor(100000 + Math.random() * 900000).toString();

    let body;

    // Try to create Firebase Auth user
    try {
      const userRecord = await admin.auth().createUser({
        email: customerEmail,
        password: generatedPassword,
        emailVerified: false,
      });
      console.log(`user created ${customerEmail} ${generatedPassword}`);

      body = bodyWithPassword
      .replace('[PASSWORD]', generatedPassword);
    } catch (authError) {
      console.error(authError);
      body = bodyNoPassword;
    }

      const tgLink = await createInviteLink('-1001936183350', customerEmail);
      body = body
          .replace('[EMAIL]', customerEmail)
          .replace('[TG_LINK]', tgLink);

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

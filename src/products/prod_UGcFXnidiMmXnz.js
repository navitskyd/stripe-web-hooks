
// Онлайн-путешествие: Париж и страна Х
const { sendEmail, getRef } = require('../utils/common');
const {buildKey} = require("../utils/utils");
const productTitle = 'Онлайн-путешествие: Париж и страна Х';
async function handleProduct(productId, customerEmail, customFields) {

// Reels intensiv
  console.log(productTitle + " для " + customerEmail);

  const body = `
    Благодарим вас за оплату 💚

Совсем скоро Светлана добавит вас в закрытую группу «Близкие друзья» в Instagram и все сторис будут появляться у вас первыми в зелёном кружке.

Наше онлайн-путешествие «Париж + страна Х ✈️» начнётся в понедельник, 6 апреля.
 Вы также получаете бонус - Чек-лист путешественника с полезными вещами и аксессуарами в дорогу 🎁
 
 https://drive.google.com/file/d/1tEqpc5xKbRXNq4BkEBriYRaY3OXL2PUs/view?usp=sharing

Все stories будут сохраняться, вы сможете пересматривать их в любое время. Доступ будет открыт до 1 мая 2026 года.

Если у вас возникнут вопросы - всегда можете написать на этот имейл ✨
`

  await sendEmail('Svethappy <svethappy3@gmail.com>', customerEmail, productTitle, body);

  let instgramNick='';
  let instagramField = customFields.find((f)=>f.key==="instagram");
  if(instagramField){
    instgramNick = instagramField.text.value;
    await sendEmail('Svethappy <svethappy3@gmail.com>',
        'svethappy.blogger@gmail.com', 'Новый зритель онлайн - Париж/Милан',
        'Добавить инстаграм пользователя <b>'+instgramNick+'</b>' );
  }

  const ID = buildKey(customerEmail);
  const ref = getRef('online-paris-milan').child(ID);

  await ref.set({
    email:customerEmail,
    instagram:instgramNick
  })
  .then(() => {
    console.log('✅ new user added successfully ');
    const db = ref.root.database;
    db.goOffline();
    process.exit();
  })
  .catch((err) => {
    console.error('❌ Error writing ugc-pulse:', err);
    throw err;
  });
}

module.exports = {
  handleProduct,
};

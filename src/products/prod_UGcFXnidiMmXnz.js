
// Онлайн-путешествие: Париж и страна Х
const { sendEmail } = require('../utils/common');
const productTitle = 'Онлайн-путешествие: Париж и страна Х';
async function handleProduct(productId, customerEmail, custom_fields) {

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

  let instagramField = custom_fields.find((f)=>f.key==="instagram");
  if(instagramField){
    await sendEmail('Svethappy <svethappy3@gmail.com>', 'svethappy.blogger@gmail.com', 'Новый зритель онлайн - Париж/Милан',
        'Добавить инстаграм пользователя <b>'+instagramField.text.value+'</b>' );
  }
}

module.exports = {
  handleProduct,
};

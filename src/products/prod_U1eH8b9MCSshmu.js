
// Гайд по Стамбулу: "Готовое путешествие"
const { sendEmail } = require('../utils/common');
const { createInviteLink } = require('../utils/utils');

async function handleProduct(productId, customerEmail) {

// Reels intensiv
  console.log("Гайд по Стамбулу: \"Готовое путешествие\" для " + customerEmail);

  const body = `
    Благодарим за оплату!
    Приглашаем вас в «Готовое путешествие: Стамбул»
    Ссылки, контакты и мои личные инструкции уже ждут вас в гайде.

    https://disk.yandex.ru/d/UnbwGjNK0HHVFA

    По техническим вопросам можно писать на email <a href="mailto:svethappy3@gmail.com">svethappy3@gmail.com</a>
`

  await sendEmail('Svethappy <svethappy3@gmail.com>', customerEmail, 'Готовое путешествие: Стамбул', body);
}

module.exports = {
  handleProduct,
};

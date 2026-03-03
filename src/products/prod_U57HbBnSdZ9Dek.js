
// Гайд "UGC Креатор: что это, с чего начать, как зарабатывать"
const { sendEmail } = require('../utils/common');

async function handleProduct(productId, customerEmail) {

// Reels intensiv
  console.log('Гайд "UGC Креатор: что это, с чего начать, как зарабатывать"' + " для " + customerEmail);

  const body = `
    Благодарим за оплату!
    Высылаем вам гайд «UGC Креатор: что это, с чего начать, как зарабатывать»

    https://drive.google.com/file/d/1rZmFf1-aNBvp9bqF827sekPA6syjjqq2/view?usp=sharing

    По техническим вопросам можно писать на email <a href="mailto:svethappy3@gmail.com">svethappy3@gmail.com</a>
`

  await sendEmail('Svethappy <svethappy3@gmail.com>', customerEmail, 'Готовое путешествие: Стамбул', body);
}

module.exports = {
  handleProduct,
};

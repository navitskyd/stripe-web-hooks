
// Гайд "UGC Креатор: что это, с чего начать, как зарабатывать"
const { ugcLinkEmailAndTelegramId } = require('../utils/utils');

const productTitle = 'Гайд "UGC Креатор: что это, с чего начать, как зарабатывать"';

async function handleProduct(productId, customerEmail, session) {
    let customFields = session.custom_fields;
    let customerReferenceId = session.client_reference_id || null;
// Reels intensiv
  console.log(productTitle + " для " + customerEmail);

  const body = `
    Благодарим за оплату!
    Высылаем вам гайд «UGC Креатор: что это, с чего начать, как зарабатывать»

    https://drive.google.com/file/d/1rZmFf1-aNBvp9bqF827sekPA6syjjqq2/view?usp=sharing

    Приятного изучения и вдохновения!

    По техническим вопросам можно писать на email <a href="mailto:svethappy3@gmail.com">svethappy3@gmail.com</a>
`
    await ugcLinkEmailAndTelegramId (customerEmail, session, productTitle, body);

}

module.exports = {
  handleProduct,
};

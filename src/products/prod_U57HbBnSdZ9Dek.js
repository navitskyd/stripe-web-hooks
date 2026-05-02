
// Гайд "UGC Креатор: что это, с чего начать, как зарабатывать"
const { ugcNotifyPayment } = require('../utils/utils');

const productTitle = 'Гайд "UGC Креатор: что это, с чего начать, как зарабатывать"';

async function handleProduct(productId, customerEmail, customFields, customerReferenceId) {

// Reels intensiv
  console.log(productTitle + " для " + customerEmail);

  const body = `
    Благодарим за оплату!
    Высылаем вам гайд «UGC Креатор: что это, с чего начать, как зарабатывать»

    https://drive.google.com/file/d/1rZmFf1-aNBvp9bqF827sekPA6syjjqq2/view?usp=sharing

    Приятного изучения и вдохновения!

    По техническим вопросам можно писать на email <a href="mailto:svethappy3@gmail.com">svethappy3@gmail.com</a>
`
    await ugcNotifyPayment (customerEmail, customerReferenceId, productTitle, body);

}

module.exports = {
  handleProduct,
};

const
    fs = require('fs');

async function main(productId, customerEmail, session) {
  const path = require('path');

  const handlerPath = path.join(__dirname, '..', 'src', 'products',
      `${productId}.js`);

  if (!fs.existsSync(handlerPath)) {
    console.error('Handler file not found:', handlerPath);
    return;
  }

  const handlerModule = require(handlerPath); // CommonJS

  const handleProduct = handlerModule.handleProduct; // named export
  if (typeof handleProduct === 'function') {
    await handleProduct(productId, customerEmail, session);
  } else {
    console.error('handleProduct is not a function in module:', handlerPath);
  }
}

const myTG = 5533843441;
// пример вызова
// main('prod_TLoR6Pvip9OLxU', 'dnavitski@gmail.com', {
//   id: "cs_live_a19dbT8tQntvAhdm16zwTXNNf8PCYb2lu6kffITRixkhfz5cJ9GMNwjUwI",
//   customFields: [], client_referenceId: null
// }).catch(console.error);

//main('prod_TravelStream2', 'dnavitski@gmail.com',[]).catch(console.error)
// main('prod_Tw7UBkg0EBa9A0', 'pr.nadiacreates@gmail.com',[]).catch(console.error)

main('prod_TLoPLmbyPJkGOK', 'dnavitski@gmail.com',[]).catch(console.error)
main('prod_TLoR6Pvip9OLxU', 'dnavitski@gmail.com',[]).catch(console.error)


const fs = require('fs');

async function main(productId, customerEmail) {
  const path = require('path');

  const handlerPath = path.join(__dirname,'..', 'src', 'products', `${productId}.js`);

  if (!fs.existsSync(handlerPath)) {
    console.error('Handler file not found:', handlerPath);
    return;
  }

  const handlerModule = require(handlerPath); // CommonJS

  const handleProduct = handlerModule.handleProduct; // named export

  if (typeof handleProduct === 'function') {
    await handleProduct(productId, customerEmail);
  } else {
    console.error('handleProduct is not a function in module:', handlerPath);
  }
}

// пример вызова
//  main('prod_TLoPLmbyPJkGOK', 'dnavitski@gmail.com').catch(console.error)
//  .then(()=> main('prod_TLoR6Pvip9OLxU', 'dnavitski@gmail.com').catch(console.error));

// main('prod_TLoPLmbyPJkGOK', 'dnavitski@gmail.com').catch(console.error)
// main('prod_TLoR6Pvip9OLxU', 'katloverusakovich@gmail.com').catch(console.error)

// main('prod_TqQ0yWcDioH90x', 'dnavitski@gmail.com').catch(console.error);
// main('prod_Tw7UBkg0EBa9A0', 'dnavitski@gmail.com').catch(console.error);
// main('prod_Tw7Wukp1CIRUU9', 'dnavitski@gmail.com').catch(console.error);
// main('prod_Tx8BAeTMqW42GP', 'dnavitski@gmail.com').catch(console.error);
// main('prod_Tx89OR3aYHSh1n', 'dnavitski@gmail.com').catch(console.error);
main('prod_U1eH8b9MCSshmu', 'dnavitski@gmail.com').catch(console.error);


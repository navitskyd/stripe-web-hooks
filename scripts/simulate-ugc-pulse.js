const path = require('path');
const fs = require('fs');
const { db, getRef } = require('./common');

async function main(productId, customerEmail) {
  const path = require('path');

  const handlerPath = path.join(__dirname,'..', 'dist', 'products', `${productId}.js`);
  console.log(handlerPath)

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
main('prod_TLoPLmbyPJkGOK', 'dnavitski@gmail.com').catch(console.error);
main('prod_TLoR6Pvip9OLxU', 'dnavitski@gmail.com').catch(console.error);

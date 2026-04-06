const fs = require('fs');

async function main(productId, customerEmail, customFields) {
  const path = require('path');

  const handlerPath = path.join(__dirname,'..', 'src', 'products', `${productId}.js`);

  if (!fs.existsSync(handlerPath)) {
    console.error('Handler file not found:', handlerPath);
    return;
  }

  const handlerModule = require(handlerPath); // CommonJS

  const handleProduct = handlerModule.handleProduct; // named export

  if (typeof handleProduct === 'function') {
    await handleProduct(productId, customerEmail,customFields);
  } else {
    console.error('handleProduct is not a function in module:', handlerPath);
  }
}

// пример вызова
//  main('prod_TLoPLmbyPJkGOK', 'dnavitski@gmail.com').catch(console.error)
//  .then(()=> main('prod_TLoR6Pvip9OLxU', 'dnavitski@gmail.com').catch(console.error));

 //main('prod_TravelStream2', 'dnavitski@gmail.com',[]).catch(console.error)




// Paris online
main('prod_UGcFXnidiMmXnz', 'dnavitski@gmail.com',[{
  key:'instagram',
    text:
        {
          value:'dzima8762'
        }
  }]).catch(console.error);

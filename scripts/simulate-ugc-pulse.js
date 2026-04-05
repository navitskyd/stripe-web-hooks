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

 //main('prod_TravelStream2', 'Nastia.sukhova@gmail.com').catch(console.error)


main('prod_UGcFXnidiMmXnz', 'olga.kursy.95@mail.ru').catch(console.error);
main('prod_UGcFXnidiMmXnz', 'perikovna@gmail.com').catch(console.error);
main('prod_UGcFXnidiMmXnz', 'olga.pinchuk.27@gmail.com').catch(console.error);
main('prod_UGcFXnidiMmXnz', 'susanina.irina@gmail.com').catch(console.error);
main('prod_UGcFXnidiMmXnz', 'pataeva_86@mail.ru').catch(console.error);
main('prod_UGcFXnidiMmXnz', '6742730@gmail.com').catch(console.error);
main('prod_UGcFXnidiMmXnz', 'karina_cheshko@mail.ru').catch(console.error);
main('prod_UGcFXnidiMmXnz', 'maxix@tut.by').catch(console.error);
main('prod_UGcFXnidiMmXnz', 'nastya_volosach@inbox.ru').catch(console.error);
main('prod_UGcFXnidiMmXnz', 'devochka_tanya@tut.by').catch(console.error);


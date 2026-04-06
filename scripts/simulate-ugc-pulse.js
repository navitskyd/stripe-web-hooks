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

let onlineWatchers=
`olga.kursy.95@mail.ru\tolga_ugccreator
perikovna@gmail.com\tperikovna
olga.pinchuk.27@gmail.com\tMb_olinden
susanina.irina@gmail.com\tIrina_susanina
pataeva_86@mail.ru\tivolgina_tania
6742730@gmail.com\tAnjelika8998
karina_cheshko@mail.ru\t_ch_karina
maxix@tut.by\tm_zene4ka
nastya_volosach@inbox.ru\tantonenko2
devochka_tanya@tut.by\tTagemageta
katloverusakovich@gmail.com\tkatrin_rusakovich_
tatyanaskrygan@mail.ru\ttati_skryhan
nika-86-86@mail.ru\tveronika._komar
vera.taratukhina@gmail.com\tInstaveragram
svirskaya.94@gmail.com\tanastasiya.umreiko
katja2409@mail.ru\tsapotskaya2409
lencikg@seznam.cz\telen_08.15
Lmi@tut.by\tlavrinovich_julija
grigorovich_y.p.87@mail.ru\tjulia_laptseva
tigrica_2008@mail.ru\tnatalia.titko
alexandrina05@inbox.ru\tAssolka_2019
sahs_ka@mail.ru\taleksandra_polyvian
yuliyashavyro@gmail.com\tshavyro_julia
_alinkaaa_@mail.ru\ta.lzrnk
maru31081984@gmail.com\tmatsko.marina
maryia.hlushak@gmail.com\tmaryia_jurgens
malyxao.1987@gmail.com\tolgarudzko
rodnaya1999@mail.ru\telizabeth_skorobogatova`

onlineWatchers.trim().split('\n').forEach(line=>{
  const [email,instagram] = line.split("\t");


});

// Paris online
// main('prod_UGcFXnidiMmXnz', email,[{
//   key:'instagram',
//   text:
//       {
//         value:instagram
//       }
// }]).catch(console.error);


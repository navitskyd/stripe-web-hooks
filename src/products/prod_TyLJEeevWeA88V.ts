import { sendEmail } from '../utils/email';

export const handleProduct = async (productId: string, customerEmail: string) => {
// UGC Pulse
  console.log("Клуб создателей контента - доступ 1 месяц для " + customerEmail);

  const ugcPulseChatId = -1002906638589;
  const ugcPulseId = -1002913124875;


  const body = `
Благодарим за оплату!
Приглашаем вас в клуб «UGC Pulse»

Ссылки, контакты и мои личные инструкции уже ждут вас в закрытой Telegram группе.

Обязательно сразу подпишитесь и не теряйте этот чат!
По этой ссылке вы можете войти только ОДИН РАЗ.
Не переживайте, возможно небольшое ожидание, но вас обязательно добавят в течение суток.

Заходите сюда ⬇️ 

https://t.me/+8Jz7SAhhFDNiZTFi

Обязательно присоединяйтесь во второй чат - для вопросов и обратной связи от Светланы лично

https://t.me/+SLp3Vox-kMNjZGVi

Все материалы в доступе месяц для изучения в Telegram. 
И конечно будут дополняться, читайте правила участия!

По техническим вопросам можно писать на email <a href="mailto:svethappy3@gmail.com">svethappy3@gmail.com</a>
`
  await sendEmail('Svethappy <svethappy3@gmail.com>', customerEmail, 'UGC Pulse', body);
};

import {createInviteLink} from "../utils/utils";
import {sendEmail} from "../utils/email";

export const handleProduct = async (productId: string, customerEmail: string) => {

  // UGC Lab
  console.log("Практикум по съемке UGC видео для " + customerEmail);

  const body = `
Благодарим за оплату!
Приглашаем вас в «Практикум по съемке UGC видео»

Ссылки, контакты и мои личные инструкции уже ждут вас в закрытой Telegram группе.

Обязательно сразу подпишитесь и не теряйте этот чат!
По этой ссылке вы можете войти только ОДИН РАЗ.
Не переживайте, возможно небольшое ожидание, но вас обязательно добавят в течение суток.

Заходите сюда ⬇️ 

[TG_LINK]

По техническим вопросам можно писать на email <a href="mailto:svethappy3@gmail.com">svethappy3@gmail.com</a>
`
  // create personalized TG link
  const tgLink = await createInviteLink( "-1003861932078",customerEmail);
  const personalizedBody = body.replace('[TG_LINK]', tgLink);

  await sendEmail('Svethappy <svethappy3@gmail.com>', customerEmail, 'Практикум по съемке UGC видео"', personalizedBody);
};

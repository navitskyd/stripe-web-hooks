import {sendEmail} from "../utils/email";
import {createInviteLink} from "../utils/utils";

export const handleProduct = async (productId: string, customerEmail: string) => {
  // Photo video svet
  console.log("Курс по созданию качественного контента и развитию соц сетей для " + customerEmail);

  const body = `
Благодарим за оплату!
Приглашаем вас в проект Photo&Video Svet

Все видеоуроки, комплект из фото и видео пресетов, а также конспекты и гайды, инструкции уже ждут вас в закрытой Telegram группе!

Чтобы получить доступ к приобретенным материалам вам обязательно нужно завершить регистрацию⏬⏬⏬

Для этого перейдите по кнопке ниже и подключите Telegram
Обязательно сразу подпишитесь и не теряйте этот чат!!!
По этой ссылке вы можете войти только ОДИН РАЗ.

<a href="[TG_LINK]">
<button style="background-color: #00adef;color: whitesmoke; padding-bottom: 15px;border-radius: 6px;">
Подключить телеграм
</button>
</a>

Все материалы уже в доступе для изучения в Telegram, ДОСТУП НАВСЕГДА.

По техническим вопросам можно писать на email <a href="mailto:svethappy3@gmail.com">svethappy3@gmail.com</a>
`

  // create personalized TG link
  const tgLink = await createInviteLink( "-1002667063289",customerEmail);
  const personalizedBody = body.replace('[TG_LINK]', tgLink);

  await sendEmail('Svethappy <svethappy3@gmail.com>', customerEmail, 'Курс "Video&PhotoSvet"', personalizedBody);

};

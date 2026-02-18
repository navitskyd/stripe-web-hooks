// telegram.js
const axios = require('axios');
const crypto = require("crypto");
// парсер даты формата dd.MM.yyyy → Date
function parseDMY(dateStr) {
  if (!dateStr) {
    return null;
  }

  try {
    const [d, m, y] = dateStr.split('.').map((p) => parseInt(p, 10));
    if (!d || !m || !y) {
      return new Date(dateStr)
    }

    return new Date(y, m - 1, d);
  } catch (err) {
    console.warn('Failed to parse date:', dateStr, err);
    return new Date(dateStr)
  }
}

const generatePassword = (length = 6) => {
  let sequence = '';
  for (let i = 0; i < length; i++) {
    sequence += Math.floor(Math.random() * 10);
  }
  return sequence;
};

function createInviteLink(chatId, name) {
  const BOT_TOKEN = process.env.TGBOT_TOKEN;
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/createChatInviteLink`;
  const params = {
    chat_id: chatId,
    name: name,
    member_limit: 1,
  };

  return axios
  .post(url, params)
  .then((response) => {
    if (response.data.ok) {
      return response.data.result.invite_link;
    } else {
      throw new Error(`Error: ${response.data.description}`);
    }
  })
  .catch((error) => {
    console.error('Failed to create invite link:', error.message || error);
    throw error;
  });
}
// разница в днях (today - lastPayment)
function calcDaysFrom(lastPaymentStr) {
  const today = new Date();
  const d = parseDMY(lastPaymentStr);
  if (!d) {
    return 0;
  }

  const ms = today.getTime() - d.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24)); // [web:77]
}
function keyFromUserId(userID) {
  return crypto.createHash('sha256').update(userID || 'no-id', 'utf8').digest('hex');
}
function extractNumber(str) {
  if (str == null) return null;

  // Ищем первую последовательность цифр (возможно с точкой/запятой)
  const match = String(str).match(/[-+]?\d*[\.,]?\d+/);
  if (!match) return null;

  // Заменяем запятую на точку и парсим
  const num = parseFloat(match[0].replace(',', '.'));
  return Number.isNaN(num) ? null : num;
}
module.exports = {
  generatePassword,
  createInviteLink,parseDMY,calcDaysFrom,keyFromUserId,extractNumber
};

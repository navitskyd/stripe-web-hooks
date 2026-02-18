// telegram.js
const axios = require('axios');

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

module.exports = {
  generatePassword,
  createInviteLink,
};

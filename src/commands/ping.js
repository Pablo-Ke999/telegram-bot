// ping.js
module.exports = {
  name: 'ping',
  description: 'Check if the bot is awake.',
  execute(msg, bot) {
    const chatId = msg.chat.id;
    const now = new Date().toLocaleString();
    bot.sendMessage(chatId, `🏓 Pong! Server time: ${now}`);
  }
};
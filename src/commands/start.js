// start.js
module.exports = {
  name: 'start',
  description: 'Start the bot and get a welcome message.',
  execute(msg, bot) {
    const chatId = msg.chat.id;
    const firstName = msg.from.first_name || 'there';
    bot.sendMessage(chatId, `👋 Hello, ${firstName}! I'm alive and ready to help.`);
  }
};
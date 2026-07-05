// app.js – Open the Mini App
module.exports = {
  name: 'app',
  description: 'Open the graphical Mini App.',
  execute(msg, bot) {
    const chatId = msg.chat.id;
    const miniAppUrl = 'https://pablo-ke999.github.io/telegram-bot/';  // your URL
    const keyboard = {
      inline_keyboard: [[
        { text: '💬 Open Chat', web_app: { url: miniAppUrl } }
      ]]
    };
    bot.sendMessage(chatId, 'Tap below to open the Mini App 👇', { reply_markup: keyboard });
  }
};
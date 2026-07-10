// help.js – Shows a list of all available commands
module.exports = {
  name: 'help',
  description: 'Show this help message',

  execute(msg, bot, context) {
    const chatId = msg.chat.id;
    const commandList = context.commandList || [];

    if (commandList.length === 0) {
      return bot.sendMessage(chatId, 'No commands are available right now.');
    }

    const helpText = '🤖 *Available commands:*\n' + commandList.join('\n');
    bot.sendMessage(chatId, helpText, { parse_mode: 'Markdown' });
  }
};
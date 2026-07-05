// logs.js – View recent console logs (admin only)
const config = require('../configLoader').loadConfig();

module.exports = {
  name: 'logs',
  description: 'View recent bot logs (admin only).',
  execute(msg, bot, context) {
    const chatId = msg.chat.id;
    const admins = config.adminUsers.length > 0 ? config.adminUsers : config.allowedUsers;
    if (admins.length > 0 && !admins.includes(msg.from.id)) {
      return bot.sendMessage(chatId, '⛔ You are not authorized to view logs.');
    }
    const logs = context.getLogs(50);
    if (!logs || logs.length === 0) {
      return bot.sendMessage(chatId, 'No logs available yet.');
    }
    const logText = logs.join('\n');
    const maxLen = 4000;
    const truncated = logText.length > maxLen ? logText.substring(logText.length - maxLen) : logText;
    bot.sendMessage(chatId, `📋 *Recent logs:*\n\`\`\`\n${truncated}\n\`\`\``, { parse_mode: 'Markdown' });
  }
};
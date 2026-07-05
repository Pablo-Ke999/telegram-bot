// broadcast.js – Send a message to all known users (admin only)
const fs = require('fs');
const path = require('path');
const config = require('../configLoader').loadConfig();
const USERS_FILE = path.join(__dirname, '..', 'users.json');

module.exports = {
  name: 'broadcast',
  description: 'Send a message to all known users (admin only).',
  async execute(msg, bot) {
    const chatId = msg.chat.id;
    const admins = config.adminUsers.length > 0 ? config.adminUsers : config.allowedUsers;
    if (admins.length > 0 && !admins.includes(msg.from.id)) {
      return bot.sendMessage(chatId, '⛔ Admin only.');
    }
    const text = msg.text.replace('/broadcast', '').trim();
    if (!text) return bot.sendMessage(chatId, 'Usage: /broadcast <message>');

    let userIds = [];
    if (fs.existsSync(USERS_FILE)) {
      userIds = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    }
    bot.sendMessage(chatId, `📢 Broadcasting to ${userIds.length} users...`);
    for (const uid of userIds) {
      try { await bot.sendMessage(uid, `📢 Broadcast: ${text}`); } catch (_) {}
    }
  }
};
// setpersona.js – Change AI system prompt (admin only)
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const config = require('../configLoader').loadConfig();

module.exports = {
  name: 'setpersona',
  description: 'Change the AI system prompt (admin only).',
  execute(msg, bot) {
    const chatId = msg.chat.id;
    const admins = config.adminUsers.length > 0 ? config.adminUsers : config.allowedUsers;
    if (admins.length > 0 && !admins.includes(msg.from.id)) {
      return bot.sendMessage(chatId, '⛔ Admin only.');
    }
    const newPrompt = msg.text.replace('/setpersona', '').trim();
    if (!newPrompt) return bot.sendMessage(chatId, 'Usage: /setpersona <new personality>');

    const configPath = path.join(__dirname, '..', '..', 'config.yaml');
    const raw = fs.readFileSync(configPath, 'utf8');
    const cfg = yaml.load(raw);
    cfg.ai.systemPrompt = newPrompt;
    fs.writeFileSync(configPath, yaml.dump(cfg, { lineWidth: -1 }));
    bot.sendMessage(chatId, '✅ Personality updated. Restart may be needed.');
  }
};
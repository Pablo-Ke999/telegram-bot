// main.js
// Purpose: Bootstraps the Telegram bot, loads config, registers commands,
//          sets up message handling with AI fallback and error resilience.

require('dotenv').config();   // load environment variables from .env
const TelegramBot = require('node-telegram-bot-api').default;

const { loadConfig } = require('./configLoader');
const { loadCommands } = require('./commandRegistry');
const AIClient = require('./aiClient');

// --- Constants ---
const DEFAULT_ERROR_MESSAGE = "Sorry, I'm having a brain freeze. Ping the admin.";

// --- Load and validate configuration ---
let config;
try {
  config = loadConfig();
} catch (err) {
  console.error('❌ Configuration error:', err.message);
  process.exit(1);
}

// --- Initialise bot ---
const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error('❌ TELEGRAM_BOT_TOKEN is missing. Create a .env file or set the environment variable.');
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

// --- Load command registry ---
const { commands, descriptions } = loadCommands();

// --- Initialise AI client ---
const aiClient = new AIClient();

// --- Helper: check if user is allowed ---
function isUserAllowed(msg) {
  const allowed = config.allowedUsers;
  if (!Array.isArray(allowed) || allowed.length === 0) return true;
  return allowed.includes(msg.from.id);
}

// --- Helper: respond with a static trigger if any keyword matches ---
function findTriggerReply(text) {
  const triggers = config.responseTriggers;
  if (!triggers.length) return null;

  const lowerText = text.toLowerCase().trim();
  for (const trigger of triggers) {
    if (lowerText === trigger.keyword.toLowerCase().trim()) {
      return trigger.reply;
    }
  }
  return null;
}

// --- Core message handler ---
bot.on('message', async (msg) => {
  try {
    if (!msg.text) return;

    if (!isUserAllowed(msg)) {
      bot.sendMessage(msg.chat.id, '⛔ You are not authorised to use this bot.');
      return;
    }

    const text = msg.text.trim();
    const chatId = msg.chat.id;

    if (text.startsWith('/')) {
      let commandName = text.split(' ')[0].substring(1);
      const atIndex = commandName.indexOf('@');
      if (atIndex !== -1) commandName = commandName.substring(0, atIndex);

      const commandHandler = commands.get(commandName);
      if (commandHandler) {
        await commandHandler.execute(msg, bot);
        return;
      }
    }

    const triggerReply = findTriggerReply(text);
    if (triggerReply) {
      bot.sendMessage(chatId, triggerReply);
      return;
    }

    const aiReply = await aiClient.sendMessage(text, []);
    bot.sendMessage(chatId, aiReply);

  } catch (err) {
    console.error('Unhandled error in message handler:', err);
    try {
      bot.sendMessage(msg.chat.id, DEFAULT_ERROR_MESSAGE);
    } catch (_) { /* ignore secondary errors */ }
  }
});

console.log(`🤖 ${config.bot.name} started.`);
console.log(`📋 Commands: ${Array.from(commands.keys()).map(c => '/' + c).join(', ')}`);
console.log(`🔧 AI provider: ${aiClient.isMock ? 'MOCK' : config.ai.provider}`);
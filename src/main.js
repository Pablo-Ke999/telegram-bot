// main.js
// Purpose: Bootstraps the Telegram bot, loads config, registers commands,
//          sets up message handling with AI fallback and error resilience.

require('dotenv').config();   // load environment variables from .env
const TelegramBot = require('node-telegram-bot-api').default;

const fs = require('fs');
const path = require('path');
const { loadConfig } = require('./configLoader');
const { loadCommands } = require('./commandRegistry');
const AIClient = require('./aiClient');

// --- Constants ---
const MAX_LOG_LINES = 1000;
const logBuffer = [];

function addToLog(level, ...args) {
  const timestamp = new Date().toISOString();
  const message = args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ');
  logBuffer.push(`[${timestamp}] [${level}] ${message}`);
  if (logBuffer.length > MAX_LOG_LINES) logBuffer.shift();
}

// Intercept console methods
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
console.log = (...args) => { addToLog('LOG', ...args); originalConsoleLog.apply(console, args); };
console.error = (...args) => { addToLog('ERROR', ...args); originalConsoleError.apply(console, args); };
console.warn = (...args) => { addToLog('WARN', ...args); originalConsoleWarn.apply(console, args); };
const DEFAULT_ERROR_MESSAGE = "Sorry, I'm having a brain freeze. Ping the admin.";

// --- Load and validate configuration ---
let config;
try {
  config = loadConfig();
} catch (err) {
  console.error('❌ Configuration error:', err.message);
  process.exit(1);
}
const chatHistory = new Map();
const MAX_HISTORY = 20;

// --- Initialise bot ---
process.env.NTBA_FIX_350 = '1';   // suppress deprecation warning
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
    // Save user ID for broadcast
const usersFile = path.join(__dirname, 'users.json');
let users = [];
if (fs.existsSync(usersFile)) users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
if (!users.includes(msg.from.id)) {
  users.push(msg.from.id);
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
}

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
      const context = {
  getLogs: (lines = 50) => logBuffer.slice(-lines),
};
await commandHandler.execute(msg, bot, context);
        return;
      }
    }

    const triggerReply = findTriggerReply(text);
    if (triggerReply) {
      bot.sendMessage(chatId, triggerReply);
      return;
    }

    const history = chatHistory.get(chatId) || [];
const aiReply = await aiClient.sendMessage(text, history);
history.push({ role: 'user', content: text });
history.push({ role: 'assistant', content: aiReply });
if (history.length > MAX_HISTORY * 2) history = history.slice(-MAX_HISTORY * 2);
chatHistory.set(chatId, history);
bot.sendMessage(chatId, aiReply);

  } catch (err) {
    console.error('Unhandled error in message handler:', err);
    try {
      bot.sendMessage(msg.chat.id, DEFAULT_ERROR_MESSAGE);
    } catch (_) { /* ignore secondary errors */ }
  }
});

bot.on('web_app_data', async (msg) => {
  const chatId = msg.chat.id;
  let data;
  try {
    data = JSON.parse(msg.web_app_data.data);
  } catch (e) {
    return bot.sendMessage(chatId, 'Invalid data from Mini App.');
  }

  if (data.action === 'user_message') {
    const userText = data.text;
    const history = chatHistory.get(chatId) || [];
    const aiReply = await aiClient.sendMessage(userText, history);
    history.push({ role: 'user', content: userText });
    history.push({ role: 'assistant', content: aiReply });
    if (history.length > MAX_HISTORY * 2) history = history.slice(-MAX_HISTORY * 2);
    chatHistory.set(chatId, history);
    bot.sendMessage(chatId, aiReply);
  } else {
    bot.sendMessage(chatId, 'Unknown Mini App action.');
  }
});

console.log(`🤖 ${config.bot.name} started.`);
console.log(`📋 Commands: ${Array.from(commands.keys()).map(c => '/' + c).join(', ')}`);
console.log(`🔧 AI provider: ${aiClient.isMock ? 'MOCK' : config.ai.provider}`);
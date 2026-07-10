// main.js
// Purpose: Bootstraps the Telegram bot, loads config, commands, tools,
//          log capture, conversation history, user tracking, Mini App support.

require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api').default;
const fs = require('fs');
const path = require('path');

const { loadConfig } = require('./configLoader');
const { loadCommands } = require('./commandRegistry');
const { loadTools } = require('./toolRegistry');
const AIClient = require('./aiClient');

// --- Constants & Log Capture ---
const MAX_LOG_LINES = 1000;
const logBuffer = [];
const DEFAULT_ERROR_MESSAGE = "Sorry, I'm having a brain freeze. Ping the admin.";

function addToLog(level, ...args) {
  const timestamp = new Date().toISOString();
  const message = args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ');
  logBuffer.push(`[${timestamp}] [${level}] ${message}`);
  if (logBuffer.length > MAX_LOG_LINES) logBuffer.shift();
}

const origLog = console.log, origErr = console.error, origWarn = console.warn;
console.log   = (...a) => { addToLog('LOG', ...a); origLog(...a); };
console.error = (...a) => { addToLog('ERROR', ...a); origErr(...a); };
console.warn  = (...a) => { addToLog('WARN', ...a); origWarn(...a); };

// --- Config ---
let config;
try {
  config = loadConfig();
} catch (err) {
  console.error('❌ Configuration error:', err.message);
  process.exit(1);
}

// --- Conversation history ---
const chatHistory = new Map();
const MAX_HISTORY = 20;

// --- Tools (loaded once) ---
let toolDefinitions = [];
let toolExecutors = {};
if (config.features && config.features.enableToolCalling !== false) {
  const tools = loadTools();
  toolDefinitions = tools.definitions;
  toolExecutors = tools.executors;
}

// --- Bot init ---
process.env.NTBA_FIX_350 = '1';
const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error('❌ TELEGRAM_BOT_TOKEN missing.');
  process.exit(1);
}
const bot = new TelegramBot(token, { polling: true });

// --- Commands & AI ---
const { commands, descriptions } = loadCommands();
const aiClient = new AIClient();

// --- Helpers ---
function isUserAllowed(msg) {
  const allowed = config.allowedUsers;
  if (!Array.isArray(allowed) || allowed.length === 0) return true;
  return allowed.includes(msg.from.id);
}

function findTriggerReply(text) {
  const triggers = config.responseTriggers;
  if (!triggers.length) return null;
  const lower = text.toLowerCase().trim();
  for (const t of triggers) {
    if (lower === t.keyword.toLowerCase().trim()) return t.reply;
  }
  return null;
}

// ========== MESSAGE HANDLER (async) ==========
bot.on('message', async (msg) => {
  try {
    if (!msg.text) return;
    const chatId = msg.chat.id;
    const text = msg.text.trim();

    // -- User tracking for broadcast --
    const usersFile = path.join(__dirname, 'users.json');
    let users = [];
    if (fs.existsSync(usersFile)) users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
    if (!users.includes(msg.from.id)) {
      users.push(msg.from.id);
      fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
    }

    if (!isUserAllowed(msg)) {
      return bot.sendMessage(chatId, '⛔ Not authorised.');
    }

    // -- Slash commands --
    if (text.startsWith('/')) {
      let cmd = text.split(' ')[0].substring(1);
      const at = cmd.indexOf('@');
      if (at !== -1) cmd = cmd.substring(0, at);
      const handler = commands.get(cmd);
      if (handler) {
        const ctx = {
          getLogs: (n = 50) => logBuffer.slice(-n),
          commandList: descriptions,
        };
        await handler.execute(msg, bot, ctx);
        return;
      }
    }

    // -- Static triggers --
    const trigger = findTriggerReply(text);
    if (trigger) return bot.sendMessage(chatId, trigger);

    // -- AI with tools + history --
    const history = chatHistory.get(chatId) || [];
    const aiReply = await aiClient.sendMessage(text, history, toolDefinitions, toolExecutors);

    // Save history
    history.push({ role: 'user', content: text });
    history.push({ role: 'assistant', content: aiReply });
    if (history.length > MAX_HISTORY * 2) history = history.slice(-MAX_HISTORY * 2);
    chatHistory.set(chatId, history);

    // Send reply – if the AI returned an image URL, send the photo directly
    const imageMatch = aiReply.match(/(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|webp)(?:\?[^\s]*)?)/i);
    if (imageMatch) {
      await bot.sendPhoto(chatId, imageMatch[0], { caption: text });
    } else {
      bot.sendMessage(chatId, aiReply);
    }

  } catch (err) {
    console.error('Message handler error:', err);
    try { bot.sendMessage(msg.chat.id, DEFAULT_ERROR_MESSAGE); } catch (_) {}
  }
});

// ========== MINI APP DATA ==========
bot.on('web_app_data', async (msg) => {
  try {
    const chatId = msg.chat.id;
    const data = JSON.parse(msg.web_app_data.data);
    if (data.action === 'user_message') {
      const history = chatHistory.get(chatId) || [];
      const aiReply = await aiClient.sendMessage(data.text, history, toolDefinitions, toolExecutors);
      history.push({ role: 'user', content: data.text });
      history.push({ role: 'assistant', content: aiReply });
      if (history.length > MAX_HISTORY * 2) history = history.slice(-MAX_HISTORY * 2);
      chatHistory.set(chatId, history);
      bot.sendMessage(chatId, aiReply);
    } else {
      bot.sendMessage(chatId, 'Unknown action.');
    }
  } catch (e) {
    console.error('web_app_data error:', e);
  }
});

// --- Startup logs ---
console.log(`🤖 ${config.bot.name} started.`);
console.log(`📋 Commands: ${Array.from(commands.keys()).map(c => '/' + c).join(', ')}`);
console.log(`🔧 AI provider: ${aiClient.isMock ? 'MOCK' : config.ai.provider}`);
// configLoader.js
// Purpose: Load and validate the bot configuration from config.yaml.
//          Exposes a single, frozen config object.

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// --- Constants (no magic numbers) ---
const CONFIG_PATH = path.join(__dirname, '..', 'config.yaml');
const ALLOWED_TEMPERATURE_RANGE = { min: 0.1, max: 1.0 };
const ALLOWED_MAX_TOKENS_RANGE = { min: 1, max: 4096 };

function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    throw new Error(`Configuration file not found at ${CONFIG_PATH}. Please create it using config.yaml as a template.`);
  }

  const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
  const config = yaml.load(raw);

  if (!config.bot || !config.bot.name) {
    throw new Error('config.yaml: "bot.name" is required.');
  }
  if (!config.ai) {
    throw new Error('config.yaml: "ai" section is required.');
  }
  if (config.ai.temperature !== undefined) {
    const t = config.ai.temperature;
    if (typeof t !== 'number' || t < ALLOWED_TEMPERATURE_RANGE.min || t > ALLOWED_TEMPERATURE_RANGE.max) {
      throw new Error(`config.yaml: ai.temperature must be between ${ALLOWED_TEMPERATURE_RANGE.min} and ${ALLOWED_TEMPERATURE_RANGE.max}. Got ${t}`);
    }
  }
  if (config.ai.maxTokens !== undefined) {
    const mt = config.ai.maxTokens;
    if (!Number.isInteger(mt) || mt < ALLOWED_MAX_TOKENS_RANGE.min || mt > ALLOWED_MAX_TOKENS_RANGE.max) {
      throw new Error(`config.yaml: ai.maxTokens must be an integer between ${ALLOWED_MAX_TOKENS_RANGE.min} and ${ALLOWED_MAX_TOKENS_RANGE.max}. Got ${mt}`);
    }
  }

  config.ai.temperature = config.ai.temperature ?? 0.7;
  config.ai.maxTokens = config.ai.maxTokens ?? 500;
  config.ai.provider = config.ai.provider ?? 'gemini';
  config.ai.model = config.ai.model ?? 'gpt-3.5-turbo';
  config.ai.fallbackMockMessage = config.ai.fallbackMockMessage ?? '🤖 Mock mode: I would reply to "{message}" here.';

  config.adminUsers = config.adminUsers ?? [];
  config.allowedUsers = config.allowedUsers ?? [];
  config.responseTriggers = config.responseTriggers ?? [];
  config.defaults = config.defaults ?? {};
  config.defaults.retryAttempts = config.defaults.retryAttempts ?? 3;
  config.defaults.requestTimeoutMs = config.defaults.requestTimeoutMs ?? 10000;
  config.features = config.features ?? {};
  config.features.enableToolCalling = config.features.enableToolCalling ?? true;

  return Object.freeze(config);
}

module.exports = { loadConfig };
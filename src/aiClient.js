// aiClient.js
// Purpose: Groq AI service (OpenAI-compatible) with mock fallback.

const OpenAI = require('openai');
const config = require('./configLoader').loadConfig();

const ERROR_REPLY = "Sorry, I'm having a brain freeze. Ping the admin.";
const MOCK_PREFIX = "🤖 [MOCK] ";
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';

class AIClient {
  constructor() {
    this.systemPrompt = config.ai.systemPrompt;
    this.temperature = config.ai.temperature;
    this.maxTokens = config.ai.maxTokens;
    this.model = config.ai.model || 'llama-3.1-8b-instant';
    this.mockFallbackMessage = config.ai.fallbackMockMessage;
    this._initClient();
  }

  _initClient() {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.warn('⚠️  GROQ_API_KEY missing. Falling back to MOCK MODE.');
      this.isMock = true;
      return;
    }

    this.openai = new OpenAI({
      apiKey,
      baseURL: GROQ_BASE_URL,
    });
    this.isMock = false;
    console.log('✅ Groq client initialized.');
  }

  async sendMessage(userMessage, messageHistory = []) {
    if (this.isMock) {
      return this._mockReply(userMessage);
    }

    try {
      return await this._aiReply(userMessage, messageHistory);
    } catch (error) {
      console.error('AI API Error:', error);
      return ERROR_REPLY;
    }
  }

  _mockReply(userMessage) {
    return MOCK_PREFIX + this.mockFallbackMessage.replace('{message}', userMessage);
  }

  async _aiReply(userMessage, messageHistory) {
    const messages = [
      { role: 'system', content: this.systemPrompt },
      ...messageHistory,
      { role: 'user', content: userMessage },
    ];

    const response = await this.openai.chat.completions.create({
      model: this.model,
      messages,
      temperature: this.temperature,
      max_tokens: this.maxTokens,
    });

    return response.choices[0].message.content;
  }
}

module.exports = AIClient;
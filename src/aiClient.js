// aiClient.js
// Purpose: Abstract AI service. Supports OpenAI API (and Groq) + mock fallback.

console.log('DEBUG OPENAI_API_KEY:', process.env.OPENAI_API_KEY?.slice(0, 10) + '...');

const OpenAI = require('openai');                        // ✅ Already changed
const config = require('./configLoader').loadConfig();

const ERROR_REPLY = "Sorry, I'm having a brain freeze. Ping the admin.";
const MOCK_PREFIX = "🤖 [MOCK] ";

class AIClient {
  constructor() {
    this.provider = config.ai.provider;
    this.systemPrompt = config.ai.systemPrompt;
    this.temperature = config.ai.temperature;
    this.maxTokens = config.ai.maxTokens;
    this.model = config.ai.model;                       // ✅ Added to store model
    this.mockFallbackMessage = config.ai.fallbackMockMessage;

    this._initClient();
  }

  _initClient() {
    /**
     * Set up the API client for 'openai' or 'gemini'.
     * Falls back to mock mode if the provider is unsupported or key missing.
     */
    if (this.provider === 'openai') {
      const apiKey = process.env.OPENAI_API_KEY;
      const baseURL = process.env.OPENAI_BASE_URL;      // For Groq / local LLMs

      if (apiKey) {
        this.openai = new OpenAI({
          apiKey,
          baseURL: baseURL || undefined,                // Use Groq URL if given
        });
        this.isMock = false;
        console.log('✅ OpenAI client initialized.');
      } else {
        console.warn('⚠️  OPENAI_API_KEY missing. Falling back to MOCK MODE.');
        this.isMock = true;
      }

    } else if (this.provider === 'gemini') {
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey) {
        this.openai = new OpenAI({ apiKey });
        this.isMock = false;
      } else {
        console.warn('⚠️  GEMINI_API_KEY missing. Falling back to MOCK MODE.');
        this.isMock = true;
      }

    } else {
      console.warn(`⚠️  AI provider "${this.provider}" not supported. Falling back to MOCK MODE.`);
      this.isMock = true;
    }
  }

  async sendMessage(userMessage, messageHistory = []) {
    if (this.isMock) {
      return this._mockReply(userMessage);
    }

    try {
      return await this._openaiReply(userMessage, messageHistory);
    } catch (error) {
      console.error('AI API Error:', error);
      return ERROR_REPLY;
    }
  }

  _mockReply(userMessage) {
    const reply = this.mockFallbackMessage.replace('{message}', userMessage);
    return MOCK_PREFIX + reply;
  }

  async _openaiReply(userMessage, messageHistory) {
    const messages = [
      { role: 'system', content: this.systemPrompt },
      ...messageHistory,
      { role: 'user', content: userMessage },
    ];

    const response = await this.openai.chat.completions.create({
      model: this.model,                                // ✅ Now uses config.ai.model
      messages,
      temperature: this.temperature,
      max_tokens: this.maxTokens,
    });

    return response.choices[0].message.content;
  }
}

module.exports = AIClient;
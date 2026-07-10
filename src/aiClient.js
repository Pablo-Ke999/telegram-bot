// aiClient.js
// Groq AI service (OpenAI-compatible) with tool calling support.

const OpenAI = require('openai');
const config = require('./configLoader').loadConfig();

const ERROR_REPLY = "Sorry, I'm having a brain freeze. Ping the admin.";
const MOCK_PREFIX = "🤖 [MOCK] ";
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';
const MAX_TOOL_ITERATIONS = 5;  // prevent infinite loops

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

  /**
   * Send a message with optional tools and history.
   * Automatically handles tool calls in a loop.
   * Falls back to text-only if tool use fails.
   */
  async sendMessage(userMessage, messageHistory = [], toolDefinitions = [], toolExecutors = {}) {
    if (this.isMock) {
      return this._mockReply(userMessage);
    }

    const baseMessages = [
      { role: 'system', content: this.systemPrompt },
      ...messageHistory,
      { role: 'user', content: userMessage }
    ];

    let toolsEnabled = toolDefinitions.length > 0;
    let currentMessages = baseMessages;
    let iterations = 0;

    while (iterations < MAX_TOOL_ITERATIONS) {
      try {
        // Call the API with tools if enabled, otherwise without
        const response = await this._callAPI(currentMessages, toolsEnabled ? toolDefinitions : []);

        const choice = response.choices[0];
        const finishReason = choice.finish_reason;
        const message = choice.message;

        // If the model just wants to chat, return the text
        if (finishReason === 'stop' || !message.tool_calls || message.tool_calls.length === 0) {
          return message.content || 'I have no response.';
        }

        // --- Handle tool calls ---
        currentMessages.push(message);

        for (const toolCall of message.tool_calls) {
          const toolName = toolCall.function.name;
          const toolArgs = JSON.parse(toolCall.function.arguments);

          const executor = toolExecutors[toolName];
          if (!executor) {
            currentMessages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              name: toolName,
              content: JSON.stringify({ error: `Tool "${toolName}" not available.` })
            });
            continue;
          }

          try {
            const result = await executor(toolArgs);
            currentMessages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              name: toolName,
              content: JSON.stringify(result)
            });
          } catch (error) {
            console.error(`Tool "${toolName}" error:`, error);
            currentMessages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              name: toolName,
              content: JSON.stringify({ error: error.message })
            });
          }
        }

        iterations++;
      } catch (error) {
        // If the model fails to use tools, retry without tools
        if (error.code === 'tool_use_failed' && toolsEnabled) {
          console.warn('⚠️  Tool use failed – retrying without tools.');
          toolsEnabled = false;
          // Reset conversation to the original base messages (without partial tool calls)
          currentMessages = baseMessages;
          iterations = 0;
          continue;
        }
        // For any other error, rethrow
        throw error;
      }
    }

    return 'I tried to answer but got stuck in a loop. Please try again.';
  }

  async _callAPI(messages, tools) {
    const params = {
      model: this.model,
      messages,
      temperature: this.temperature,
      max_tokens: this.maxTokens,
    };
    if (tools && tools.length > 0) {
      params.tools = tools;
      params.tool_choice = 'auto';
    }

    return await this.openai.chat.completions.create(params);
  }

  _mockReply(userMessage) {
    return MOCK_PREFIX + this.mockFallbackMessage.replace('{message}', userMessage);
  }
}

module.exports = AIClient;
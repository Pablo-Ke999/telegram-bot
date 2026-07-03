# Customizable Telegram AI Bot

This project is a beginner-friendly Telegram chatbot scaffold. It is designed to be easy to edit without breaking the core bot logic.

## What makes it customizable?

- Bot personality lives in `config.json`, not hidden inside code.
- Secrets live in `.env`, not in the source files.
- Commands live in separate files inside `src/commands/`.
- The command registry automatically loads command files, so adding a command does not require editing the main app.
- If no OpenAI API key is set, the bot runs in mock mode so you can test the Telegram setup for free.

## File tree

```text
customizable-telegram-ai-bot/
├── .env.example
├── config.json
├── package.json
├── README.md
└── src/
    ├── AIClient.js
    ├── commandRegistry.js
    ├── configLoader.js
    ├── index.js
    └── commands/
        ├── ping.js
        └── start.js
```

## 1. Get a Telegram Bot Token from @BotFather

1. Open Telegram.
2. Search for `@BotFather`.
3. Start a chat with BotFather.
4. Send `/newbot`.
5. Follow the prompts:
   - Choose a display name, such as `El-patron_ywobi Bot`.
   - Choose a username ending in `bot`, such as `my_helper_123_bot`.
6. BotFather will give you a token that looks like this:

```text
123456789:ABCdefYourRealTokenHere
```

Keep this token private. Anyone with this token can control your bot.

## 2. Get an OpenAI API key

OpenAI is optional for testing because this scaffold has mock mode.

1. Go to <https://platform.openai.com/>.
2. Create or sign in to your account.
3. Open the API keys page.
4. Create a new secret key.
5. Copy it immediately and store it safely.

If you leave `OPENAI_API_KEY` blank, the bot still runs but replies with the mock-mode message from `config.json`.

## 3. Install the project

Install Node.js first if you do not already have it:

- Download it from <https://nodejs.org/>.
- Choose the LTS version.

Then open a terminal in the project folder and run:

```bash
npm install
```

## 4. Create your `.env` file

Copy `.env.example` and rename the copy to `.env`.

On macOS or Linux:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Edit `.env` and paste your Telegram token:

```env
TELEGRAM_BOT_TOKEN=your_telegram_token_here
OPENAI_API_KEY=your_openai_key_here
```

To test without OpenAI credits, leave `OPENAI_API_KEY=` blank.

## 5. Change the bot's personality in `config.json`

Open `config.json` in a text editor.

The most important fields are:

- `bot.name`: The bot's friendly display name inside messages.
- `bot.description`: A short explanation of what the bot does.
- `ai.systemPrompt`: The main personality and instruction text sent to the AI.
- `ai.temperature`: Creativity level. Use `0.1` for predictable answers and `1.0` for more creative answers.
- `ai.maxTokens`: Maximum answer length.
- `security.allowedUsers`: Telegram user IDs allowed to use the bot. Leave empty (`[]`) to allow everyone.
- `responseTriggers`: Simple keyword or command replies that happen before AI is called.

Example personality change:

```json
"systemPrompt": "You are a cheerful restaurant concierge. Recommend menu items, answer briefly, and always be warm."
```

Because JSON does not support real comments, this project uses fields named `_comment` to explain what each section does.

## 6. Run the bot

Start the bot with:

```bash
npm start
```

If everything is correct, the terminal will say the bot is running. Open Telegram, find your bot username, and send:

```text
/start
```

Then try:

```text
/ping
```

## 7. Add a new command

Create a new file in `src/commands/`, for example `hello.js`:

```js
/**
 * Sends a simple hello message to the user.
 * @param {object} context - Shared command context from commandRegistry.
 * @returns {Promise<void>} Resolves after the message is sent.
 */
async function execute(context) {
  await context.bot.sendMessage(context.msg.chat.id, 'Hello from a custom command!');
}

module.exports = {
  name: '/hello',
  description: 'Says hello.',
  execute
};
```

Restart the bot and send `/hello` in Telegram.

## Troubleshooting

### The bot says the Telegram token is missing

Make sure:

- Your file is named `.env`, not `.env.example`.
- `TELEGRAM_BOT_TOKEN=` contains the token from BotFather.
- You restarted `npm start` after editing `.env`.

### The bot only echoes mock mode

That is expected when `OPENAI_API_KEY` is blank. Add your OpenAI API key to `.env` and restart the bot.

### The bot says a user is not allowed

If `security.allowedUsers` has IDs in it, only those IDs can use the bot. Empty the list to allow everyone:

```json
"allowedUsers": []
```

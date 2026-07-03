const TelegramBot = require('node-telegram-bot-api');
console.log('TelegramBot:', TelegramBot);
console.log('Type:', typeof TelegramBot);
console.log('Is function?', typeof TelegramBot === 'function');
console.log('Keys:', Object.keys(TelegramBot));
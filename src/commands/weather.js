// weather.js – Get current weather for a city
const axios = require('axios');

module.exports = {
  name: 'weather',
  description: 'Get current weather for a city.',
  async execute(msg, bot) {
    const chatId = msg.chat.id;
    const city = msg.text.replace('/weather', '').trim();
    if (!city) return bot.sendMessage(chatId, 'Usage: /weather London');
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) return bot.sendMessage(chatId, 'Weather feature not configured.');
    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;
      const res = await axios.get(url);
      const w = res.data;
      bot.sendMessage(chatId, `🌤 ${w.name}: ${w.weather[0].description}, ${w.main.temp}°C, humidity ${w.main.humidity}%`);
    } catch {
      bot.sendMessage(chatId, 'City not found or API error.');
    }
  }
};
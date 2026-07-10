// src/tools/weather.js
// A tool that fetches current weather from OpenWeatherMap

const axios = require('axios');
const config = require('../configLoader').loadConfig();

// 1. The function that actually does the work
async function getCurrentWeather({ location, units = 'metric' }) {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) throw new Error('OPENWEATHER_API_KEY not configured.');

  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${apiKey}&units=${units}`;
  const response = await axios.get(url);
  const w = response.data;
  return {
    city: w.name,
    weather: w.weather[0].description,
    temperature: w.main.temp,
    humidity: w.main.humidity,
  };
}

// 2. The tool definition (OpenAI / Groq format)
const definition = {
  type: 'function',
  function: {
    name: 'get_weather',
    description: 'Get current weather for a given city',
    parameters: {
      type: 'object',
      properties: {
        location: {
          type: 'string',
          description: 'City name, e.g. "London" or "Nairobi"'
        },
        units: {
          type: 'string',
          enum: ['metric', 'imperial'],
          description: 'Units for temperature',
          default: 'metric'
        }
      },
      required: ['location']
    }
  }
};

// 3. Export both so the registry can use them
module.exports = {
  definition,
  execute: getCurrentWeather
};
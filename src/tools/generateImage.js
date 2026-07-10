// src/tools/generateImage.js
// Tool: generate a photorealistic image using Pollinations.ai (free, no API key)

async function generateImage({ prompt }) {
  // Pollinations.ai always returns a direct image URL
  const encodedPrompt = encodeURIComponent(prompt);
  const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true&model=flux`;

  // Simulate a short delay (Pollinations is fast, but to be safe)
  await new Promise(resolve => setTimeout(resolve, 2000));

  return { image_url: imageUrl, prompt: prompt };
}

const definition = {
  type: 'function',
  function: {
    name: 'generate_image',
    description: 'Generate a photorealistic image from a text description. Use this when the user asks you to create, draw, or generate any image, picture, or visual.',
    parameters: {
      type: 'object',
      properties: {
        prompt: {
          type: 'string',
          description: 'Detailed description of the image to generate',
        },
      },
      required: ['prompt'],
    },
  },
};

module.exports = { definition, execute: generateImage };
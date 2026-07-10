// image.js – Generate a photorealistic image from a text prompt
const Replicate = require('replicate');

module.exports = {
  name: 'image',
  description: 'Generate a photorealistic image from a text description',

  async execute(msg, bot) {
    const chatId = msg.chat.id;
    const userPrompt = msg.text.replace('/image', '').trim();

    if (!userPrompt) {
      return bot.sendMessage(chatId, 'Please provide a prompt, e.g. `/image a cute cat sitting on a couch`');
    }

    if (!process.env.REPLICATE_API_KEY) {
      return bot.sendMessage(chatId, 'Image generation is not configured. Ask the admin to set REPLICATE_API_KEY.');
    }

    // Inform the user that generation has started
    bot.sendMessage(chatId, `📸 Creating a photorealistic image of "${userPrompt}" ...`);

    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_KEY,
    });

    try {
      // Build a prompt that forces photorealism
      const fullPrompt = `high quality photorealistic image of ${userPrompt}. 4k, detailed, realistic lighting, sharp focus, professional photography`;

      const output = await replicate.run(
        'stability-ai/stable-diffusion-3',   // excellent realism
        {
          input: {
            prompt: fullPrompt,
            width: 1024,
            height: 1024,
            num_inference_steps: 28,         // more steps = more detail (28 is a good balance)
            guidance_scale: 7.5,
            output_format: 'jpg',
          },
        }
      );

      // Replicate returns an array of image URLs (or a single URL)
      const imageUrl = Array.isArray(output) ? output[0] : output;

      // Send the generated photo to the user
      bot.sendPhoto(chatId, imageUrl, {
        caption: `📷 ${userPrompt}`,
      });
    } catch (error) {
      console.error('Replicate image error:', error);
      bot.sendMessage(chatId, '❌ Failed to generate the image. Try again later.');
    }
  }
};
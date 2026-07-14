const express = require('express');
const app = express();
const { getCommandsList } = require('./commandRegistry');

// ... your existing bot code ...

// Endpoint for the Mini App to fetch commands
app.get('/api/commands', (req, res) => {
    const commands = getCommandsList(); // Get your dynamic list
    res.json({
        status: 'ok',
        commands: commands
    });
});

// Start the web server (use a different port than your bot if needed, e.g., 3000)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`📡 API server running on port ${PORT}`);
});

const fileProcessor = require('./fileProcessor');
const { OpenAI } = require('openai'); // Assuming you use OpenAI

// Inside your bot.on('message', ...) or specific handlers

bot.on('message', async (ctx) => {
    try {
        let userPrompt = ctx.message.text || '';
        let fileContent = null;
        let fileBuffer = null;

        // --- CHECK FOR FILES ---
        if (ctx.message.document) {
            const doc = ctx.message.document;
            const buffer = await fileProcessor.downloadTelegramFile(ctx.telegram, doc.file_id);
            const extracted = await fileProcessor.extractText(buffer, doc.mime_type, doc.file_name);
            
            if (extracted.type === 'text') {
                fileContent = `\n\n[Content from file ${doc.file_name}]:\n${extracted.content}`;
            } else if (extracted.type === 'image') {
                fileBuffer = extracted.buffer; // For Vision API
                // Convert buffer to base64 for OpenAI
                const base64Image = buffer.toString('base64');
                // We'll handle this separately in the AI call
                ctx.session.imageBase64 = base64Image;
                ctx.session.imageMime = doc.mime_type;
            } else {
                fileContent = `\n\n[File ${doc.file_name}] could not be processed.`;
            }
        }

        if (ctx.message.photo) {
            // Get the largest photo (last in array)
            const photo = ctx.message.photo[ctx.message.photo.length - 1];
            const buffer = await fileProcessor.downloadTelegramFile(ctx.telegram, photo.file_id);
            ctx.session.imageBase64 = buffer.toString('base64');
            ctx.session.imageMime = 'image/jpeg';
            // Optional: OCR text extraction here if you don't want to use Vision API
        }

        // --- PROCESS WITH AI ---
        let finalPrompt = userPrompt + (fileContent || '');
        let reply = '';

        // Check if we have an image for Vision
        if (ctx.session.imageBase64 && process.env.OPENAI_API_KEY) {
            // Use GPT-4 Vision (or GPT-4o)
            const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
            const response = await openai.chat.completions.create({
                model: "gpt-4o", // or gpt-4-vision-preview
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: userPrompt || "Describe this image in detail." },
                            {
                                type: "image_url",
                                image_url: {
                                    url: `data:${ctx.session.imageMime};base64,${ctx.session.imageBase64}`
                                }
                            }
                        ]
                    }
                ],
                max_tokens: 500
            });
            reply = response.choices[0].message.content;
            ctx.session.imageBase64 = null; // Clear cache
        } else if (finalPrompt.trim()) {
            // Normal Text AI call (Your existing AI client)
            const aiReply = await yourAIClient.generateResponse(finalPrompt);
            reply = aiReply;
        } else {
            reply = "Please send me a message or attach a file!";
        }

        await ctx.reply(reply);

    } catch (error) {
        console.error('Error processing message:', error);
        await ctx.reply('Sorry, I had trouble processing that. Please try again.');
    }

    const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); // temporary storage

// Endpoint for Mini App file uploads
app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
        const file = req.file;
        const userId = req.body.userId;

        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const buffer = fs.readFileSync(file.path);
        const mimeType = file.mimetype;
        const filename = file.originalname;

        // Process the file using our FileProcessor
        const extracted = await fileProcessor.extractText(buffer, mimeType, filename);
        
        let reply = '';
        if (extracted.type === 'text') {
            // Send this text to your AI and get a response
            const aiReply = await yourAIClient.generateResponse(`Context from file: ${extracted.content}. Please summarize or answer based on this.`);
            reply = aiReply;
        } else if (extracted.type === 'image') {
            // Send to Vision API (similar to the Telegram handler)
            // ... implement Vision logic here ...
            reply = 'Image received. Processing... (Vision API integration pending)';
        } else {
            reply = 'Unsupported file format. Please use PDF, DOCX, or Images.';
        }

        // Clean up temp file
        fs.unlinkSync(file.path);

        res.json({ reply: reply });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
});
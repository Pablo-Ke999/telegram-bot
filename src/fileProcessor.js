const axios = require('axios');
const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');
const fs = require('fs');
const path = require('path');
const os = require('os');

class FileProcessor {
    /**
     * Downloads a file from Telegram using the bot token and file_id
     */
    async downloadTelegramFile(bot, fileId) {
        const file = await bot.api.getFile(fileId);
        const filePath = file.file_path;
        const url = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${filePath}`;
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        return response.data; // Buffer
    }

    /**
     * Extracts text based on MIME type
     */
    async extractText(buffer, mimeType, filename) {
        // For Images: we will return the buffer directly for OpenAI Vision
        if (mimeType.startsWith('image/')) {
            return { type: 'image', buffer: buffer, extension: filename.split('.').pop() };
        }

        // PDF
        if (mimeType === 'application/pdf') {
            const data = await pdfParse(buffer);
            return { type: 'text', content: data.text };
        }

        // DOCX
        if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            const result = await mammoth.extractRawText({ buffer: buffer });
            return { type: 'text', content: result.value };
        }

        // Plain text
        if (mimeType === 'text/plain') {
            return { type: 'text', content: buffer.toString('utf-8') };
        }

        // Fallback: treat as generic text or return error
        return { type: 'error', content: 'Unsupported file type.' };
    }
}

module.exports = new FileProcessor();
import { SpeechClient } from '@google-cloud/speech';
import { config } from 'dotenv';

config();

const client = new SpeechClient();

export const transcribeAudio = async (audioBuffer, languageCode = 'en-US') => {
  try {
    const config = {
      encoding: 'MP3', // Adjust based on uploaded file type
      sampleRateHertz: 16000,
      languageCode,
    };

    const audio = { content: audioBuffer.toString('base64') };
    const request = { config, audio };

    const [response] = await client.recognize(request);
    const transcription = response.results
      .map(result => result.alternatives[0].transcript)
      .join('\n');
    return transcription;
  } catch (error) {
    throw new Error(`Speech-to-Text failed: ${error.message}`);
  }
};

// Summarize transcription (using Gemini for brevity)
export const summarizeTranscription = async (transcription) => {
  const { generateReport } = await import('./geminiService.js');
  return generateReport({ transcription, task: 'summarize into 100 words or less' });
};

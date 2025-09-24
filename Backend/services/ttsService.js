import fetch from 'node-fetch';
import { toBase64 } from '../utils/helpers.js';

export async function ttsElevenLabs(text) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID;
  if (!apiKey || !voiceId) return null;

  try {
    const resp = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
      method: 'POST',
      headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, model_id: 'eleven_multilingual_v2' }),
    });
    if (!resp.ok) return null;
    const arrayBuffer = await resp.arrayBuffer();
    return toBase64(arrayBuffer);
  } catch (err) { console.error(err); return null; }
}

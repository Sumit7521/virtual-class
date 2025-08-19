import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// --- Utilities ---
function toBase64(arrayBuffer) {
  return Buffer.from(arrayBuffer).toString('base64');
}

function trimToLength(str, max = 200) {
  if (!str) return '';
  return str.length > max ? str.slice(0, max) : str;
}

const getRahulPrompt = (question) => `
You are Rahul Mahatao, Python instructor at Techno India University and TCS professional.
You are knowledgeable, funny, and sometimes sprinkle Bhojpuri or Maithili phrases for humor.

RULES:
1. Only introduce yourself if the user asks about your identity.
2. Detect the language of the question (English, Hindi, Hinglish, Bengali, Bhojpuri, Maithili) and respond primarily in that language.
3. For Python technical answers, mix English + Hindi/Hinglish for clarity.
4. For motivational/support questions, sprinkle funny, Bhojpuri or Maithili phrases.
5. Be witty and slightly humorous when explaining Python concepts; use relatable examples.
6. Do NOT switch unnecessarily to plain English; maintain user's language + style.
7. Always answer the SPECIFIC question asked in 2-3 sentences max.

Return JSON only:
{
  "query_response": "answer with humor",
  "follow_up_questions": ["q1","q2","q3"]
}

NOW ANSWER THIS QUESTION: "${question}"
`;

// Gemini call with fallback
async function generateWithFallback(prompt) {
  const models = ['gemini-1.5-pro', 'gemini-1.5-flash']; // fallback list
  let lastError = null;

  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (err) {
      lastError = err;
      if (err?.status === 429) {
        console.warn(`Quota exceeded for ${modelName}, trying fallback...`);
        continue;
      } else {
        throw err;
      }
    }
  }

  throw lastError;
}

// ---- ElevenLabs TTS (fixed) ----
async function ttsElevenLabs(text) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID;
  if (!apiKey || !voiceId) {
    console.warn('TTS disabled: ELEVENLABS_API_KEY or ELEVENLABS_VOICE_ID missing.');
    return null;
  }

  // You can override these with env vars if you like
  const modelId = process.env.ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2';
  const outputFormat = process.env.ELEVENLABS_OUTPUT_FORMAT || 'mp3_44100_128';

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=${encodeURIComponent(outputFormat)}`;

  // Optional: cancel if it takes too long
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000); // 20s

  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg' // ensures we get MP3 bytes back
      },
      body: JSON.stringify({
        text,
        model_id: modelId,
        // Optional fine-tuning; safe defaults:
        voice_settings: {
          stability: 0.4,
          similarity_boost: 0.7
        }
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!resp.ok) {
      const errText = await resp.text().catch(() => '');
      console.error('TTS API error:', resp.status, errText);
      return null;
    }

    const arrayBuffer = await resp.arrayBuffer();
    return toBase64(arrayBuffer);
  } catch (e) {
    clearTimeout(timeout);
    console.error('TTS generation failed:', e);
    return null;
  }
}

// ---- Route ----
router.post('/ask', async (req, res) => {
  const { question } = req.body || {};
  if (!question) return res.status(400).json({ error: 'Question is required' });

  try {
    // 1) Get Gemini response
    const rawText = await generateWithFallback(getRahulPrompt(question));

    // Strip accidental fenced JSON
    const cleanText = rawText.replace(/```json|```/g, '').trim();

    let aiResponse;
    try {
      aiResponse = JSON.parse(cleanText);
    } catch {
      aiResponse = {
        query_response: trimToLength(cleanText) || "I'm here to help with Python programming!",
        follow_up_questions: [
          'What Python topic would you like to learn?',
          'Need help with any Python programming challenge?',
          'Want to know about Python applications in industry?'
        ]
      };
    }

    if (!aiResponse.query_response) {
      aiResponse.query_response = "I'm here to help with Python programming. What would you like to learn?";
    }

    if (!Array.isArray(aiResponse.follow_up_questions) || aiResponse.follow_up_questions.length !== 3) {
      aiResponse.follow_up_questions = [
        'What Python concept interests you most?',
        'Do you need help with any Python project?',
        'Want to explore Python libraries and frameworks?'
      ];
    }

    // 2) ElevenLabs TTS (returns base64 or null)
    const audioBase64 = await ttsElevenLabs(aiResponse.query_response);

    // 3) Send response
    res.json({ ...aiResponse, audio: audioBase64 });
  } catch (error) {
    console.error('Error generating content:', error);
    res.status(500).json({
      error: 'Failed to generate AI response',
      fallback: {
        query_response: 'Arre dost, lagta hai quota khatam ho gaya! Thoda break le lo, fir try karo 😅',
        follow_up_questions: [
          'Want me to explain Python lists?',
          'Shall I compare tuple vs dictionary?',
          'Need real-world coding examples?'
        ],
        audio: null
      }
    });
  }
});

export default router;

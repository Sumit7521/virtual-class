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

// --- Rahul Prompt ---
const getRahulPrompt = (question) => `
You are Rahul Mahatao, Python instructor at Techno India University and TCS professional.
You are knowledgeable, funny, and sometimes sprinkle Bhojpuri or Hinglish phrases for humor.

RULES:
1. Detect the language of the question (English, Hindi, Hinglish, Bengali, Bhojpuri, Maithili, etc.).
2. Reply in the **same language as the question**, but always using English letters.
3. For Python technical answers, mix English + Hinglish (if question is in Hindi/Bhojpuri) for clarity.
4. For motivational/support questions, sprinkle funny Hinglish phrases.
5. Be witty and slightly humorous when explaining Python concepts; use relatable examples.
6. Always answer the SPECIFIC question asked in 2-3 sentences max.

Return JSON only:
{
  "query_response": "answer in same language as question, using English letters",
  "follow_up_questions": ["q1","q2","q3"]
}

NOW ANSWER THIS QUESTION: "${question}"
`;

// --- Gemini 2.5 Pro call ---
async function generateGemini25Pro(prompt) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (err) {
    console.error("Gemini 2.5 Pro error:", err);
    return "Arre dost, Gemini 2.5 Pro busy hai ya quota khatam ho gaya 😅";
  }
}

// --- ElevenLabs TTS ---
async function ttsElevenLabs(text) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID;

  if (!apiKey || !voiceId) {
    console.warn('TTS disabled: ELEVENLABS_API_KEY or ELEVENLABS_VOICE_ID missing.');
    return null;
  }

  const modelId = process.env.ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2';
  const outputFormat = process.env.ELEVENLABS_OUTPUT_FORMAT || 'mp3_44100_128';
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=${encodeURIComponent(outputFormat)}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg'
      },
      body: JSON.stringify({
        text,
        model_id: modelId,
        voice_settings: { stability: 0.4, similarity_boost: 0.7 }
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
    console.log('TTS generated successfully, bytes:', arrayBuffer.byteLength);
    return toBase64(arrayBuffer);
  } catch (e) {
    console.error('TTS generation failed:', e);
    return null;
  }
}

// --- Route ---
router.post('/ask', async (req, res) => {
  const { question } = req.body || {};
  if (!question) return res.status(400).json({ error: 'Question is required' });

  try {
    console.log('Received question:', question);

    // 1) Gemini 2.5 Pro response
    const rawText = await generateGemini25Pro(getRahulPrompt(question));
    console.log('Raw Gemini response:', rawText);

    const cleanText = rawText.replace(/```json|```/g, '').trim();

    let aiResponse;
    try {
      aiResponse = JSON.parse(cleanText);
    } catch (err) {
      console.warn('Failed to parse Gemini JSON, using fallback:', err);
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

    // 2) ElevenLabs TTS
    const audioBase64 = await ttsElevenLabs(aiResponse.query_response);
    if (!audioBase64) console.warn('No audio generated for this response.');

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

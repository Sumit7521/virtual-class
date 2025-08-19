import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fetch from 'node-fetch';

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
You are knowledgeable, funny, and sometimes sprinkle Bhojpuri or Hinglish phrases for humor.

RULES:
1. Detect the language of the question.
2. Reply in the same language but using English letters.
3. Answer Python questions concisely.
Return JSON:
{
  "query_response": "...",
  "follow_up_questions": ["q1","q2","q3"]
}

NOW ANSWER: "${question}"
`;

async function generateGemini25Pro(prompt) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (err) {
    console.error("Gemini error:", err);
    return "Gemini busy 😅";
  }
}

async function ttsElevenLabs(text) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID;
  if (!apiKey || !voiceId) return null;

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`;
  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json', 'Accept': 'audio/mpeg' },
      body: JSON.stringify({ text, model_id: 'eleven_multilingual_v2', voice_settings: { stability: 0.4, similarity_boost: 0.7 } })
    });
    if (!resp.ok) return null;
    const arrayBuffer = await resp.arrayBuffer();
    return toBase64(arrayBuffer);
  } catch (err) {
    console.error("TTS failed:", err);
    return null;
  }
}

// --- Vercel API ---
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { question } = req.body || {};
  if (!question) return res.status(400).json({ error: 'Question is required' });

  try {
    const rawText = await generateGemini25Pro(getRahulPrompt(question));
    const cleanText = rawText.replace(/```json|```/g, '').trim();

    let aiResponse;
    try {
      aiResponse = JSON.parse(cleanText);
    } catch {
      aiResponse = {
        query_response: trimToLength(cleanText) || "I'm here to help with Python!",
        follow_up_questions: ["What Python topic?", "Python challenge?", "Python applications?"]
      };
    }

    const audioBase64 = await ttsElevenLabs(aiResponse.query_response);
    res.setHeader('Access-Control-Allow-Origin', '*'); // CORS fix
    res.status(200).json({ ...aiResponse, audio: audioBase64 });
  } catch (err) {
    console.error("Error generating AI:", err);
    res.status(500).json({ error: 'Failed', audio: null });
  }
}

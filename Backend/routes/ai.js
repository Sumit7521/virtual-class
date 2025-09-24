import express from 'express';
import fetch from 'node-fetch';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { PromptTemplate } from '@langchain/core/prompts';
import { config } from 'dotenv';
import cors from 'cors';

config();

const router = express.Router();
router.use(cors());
router.use(express.json());

// --- Utilities ---
function toBase64(arrayBuffer) {
  return Buffer.from(arrayBuffer).toString('base64');
}

function detectLanguage(text) {
  const cleanText = text.toLowerCase().trim();
  // TODO: implement full language detection logic
  return 'english'; // fallback
}

// --- ElevenLabs TTS ---
async function ttsElevenLabs(text) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID;
  if (!apiKey || !voiceId) return null;

  try {
    const resp = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
      method: 'POST',
      headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.5, similarity_boost: 0.8, style: 0.2 },
      }),
    });
    if (!resp.ok) return null;
    const arrayBuffer = await resp.arrayBuffer();
    return toBase64(arrayBuffer);
  } catch (err) {
    console.error('TTS error:', err);
    return null;
  }
}

// --- LangChain PromptTemplate ---
const rahulPromptTemplate = new PromptTemplate({
  template: `
You are Rahul Mahatao, a friendly and human-like Python instructor. 
Always respond in character as Rahul, giving helpful Python advice and guidance.
Do not mention that you are a computer program.

{languageInstruction}

Strict: Respond in detected language only, SHORT, concise JSON.

JSON Format:
{{
  "query_response": "answer in {detectedLang} using ENGLISH letters only",
  "follow_up_questions": ["q1","q2","q3"]
}}

Student question: "{question}"
`,
  inputVariables: ['languageInstruction', 'detectedLang', 'question']
});

// --- Gemini via LangChain ---
async function generateGemini(detectedLang, userQuestion) {
  try {
    const model = new ChatGoogleGenerativeAI({
      model: 'gemini-2.5-flash-lite',
      apiKey: process.env.GEMINI_API_KEY,
      temperature: 0.7,
      maxOutputTokens: 300,
    });

    // Language-specific instructions
    let languageInstruction = '';
    switch (detectedLang) {
      case 'hindi':
        languageInstruction = 'Reply in Hinglish - Use Hindi words in ENGLISH letters.';
        break;
      case 'bhojpuri':
        languageInstruction = 'Reply in Bhojpuri written in ENGLISH letters only.';
        break;
      case 'bengali':
        languageInstruction = 'Reply in Bengali written in ENGLISH letters only.';
        break;
      default:
        languageInstruction = 'Reply in simple, clear English only.';
    }

    const systemPrompt = await rahulPromptTemplate.format({
      languageInstruction,
      detectedLang,
      question: userQuestion
    });

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userQuestion }
    ];

    const response = await model.call(messages);

    if (typeof response === 'string') return response;
    if (response?.text) return response.text;
    if (response?.content) return response.content;

    return null;
  } catch (err) {
    console.error('Gemini error:', err.message || err);
    return null;
  }
}

// --- Main route ---
router.post('/ask', async (req, res) => {
  const { question } = req.body || {};
  if (!question) return res.status(400).json({ error: 'Question is required' });

  try {
    const detectedLang = detectLanguage(question);
    const rawText = await generateGemini(detectedLang, question);

    if (!rawText) {
      const fallbackResponses = {
        hindi: {
          query_response: 'Sorry, main abhi busy hoon. Thoda wait karo!',
          follow_up_questions: ['Python basics?', 'Code help?', 'Aur sawaal?'],
        },
        bhojpuri: {
          query_response: 'Maafi chaahi, abhi system mein problem baa.',
          follow_up_questions: ['Python seekhe ke?', 'Code help?', 'Aur kuch?'],
        },
        bengali: {
          query_response: 'Sorry, abhi technical problem ache.',
          follow_up_questions: ['Python shikhbe?', 'Code help?', 'Aro kichhu?'],
        },
        english: {
          query_response: 'Sorry, having technical issues. Please try again later!',
          follow_up_questions: ['Python basics?', 'Code help?', 'Other questions?'],
        },
      };
      return res.json({ ...fallbackResponses[detectedLang], audio: null, detected_language: detectedLang });
    }

    const cleanText = rawText.replace(/```json|```/g, '').trim();

    let aiResponse;
    try {
      aiResponse = JSON.parse(cleanText);
    } catch {
      aiResponse = {
        query_response: `Hey! Rahul here: ${cleanText}`,
        follow_up_questions: ['Python basics?', 'Code help?', 'Need help?'],
      };
    }

    const audioBase64 = await ttsElevenLabs(aiResponse.query_response);
    res.json({ ...aiResponse, audio: audioBase64, detected_language: detectedLang });

  } catch (err) {
    console.error('Error generating AI:', err);
    res.status(500).json({ error: 'Failed', audio: null });
  }
});

export default router;

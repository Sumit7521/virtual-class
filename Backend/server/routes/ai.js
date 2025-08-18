import express from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
dotenv.config();

const router = express.Router();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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

Step 1: Identify the type of question:
- Identity question (who are you, about yourself)
- Python technical question
- Personal/emotional support needed
- Non-Python topic

Step 2: Respond appropriately to THIS SPECIFIC QUESTION ONLY.

Return JSON:
{
  "query_response": "answer to the specific question asked with humor and Bhojpuri/Maithili flavor if appropriate",
  "follow_up_questions": ["q1", "q2", "q3"]
}

NOW ANSWER THIS QUESTION: "${question}"
`;

router.post('/ask', async (req, res) => {
  const { question } = req.body;
  if (!question) return res.status(400).json({ error: "Question is required" });

  try {
    // ---------------- Gemini AI Response ----------------
    const messages = [{ role: 'user', parts: [{ text: getRahulPrompt(question) }] }];
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: messages,
      generationConfig: { temperature: 0.7, maxOutputTokens: 300, topP: 0.9 }
    });

    const cleanText = response.text.replace(/```json|```/g, '').trim();
    let aiResponse;

    try {
      aiResponse = JSON.parse(cleanText);
    } catch {
      aiResponse = {
        query_response: cleanText.substring(0, 200),
        follow_up_questions: [
          "What Python topic would you like to learn?",
          "Need help with any Python programming challenge?",
          "Want to know about Python applications in industry?"
        ]
      };
    }

    if (!aiResponse.query_response) aiResponse.query_response = "I'm here to help with Python programming. What would you like to learn?";
    if (!Array.isArray(aiResponse.follow_up_questions) || aiResponse.follow_up_questions.length !== 3)
      aiResponse.follow_up_questions = [
        "What Python concept interests you most?",
        "Do you need help with any Python project?",
        "Want to explore Python libraries and frameworks?"
      ];

    // ---------------- ElevenLabs TTS ----------------
    const elevenApiKey = process.env.ELEVENLABS_API_KEY;
    const voiceId = process.env.ELEVENLABS_VOICE_ID; // env variable
    const ttsUrl = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

    let audioBase64 = null;
    try {
      const ttsResp = await fetch(ttsUrl, {
        method: 'POST',
        headers: {
          "xi-api-key": elevenApiKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          text: aiResponse.query_response,
          format: "mp3"
        })
      });

      const arrayBuffer = await ttsResp.arrayBuffer();
      audioBase64 = Buffer.from(arrayBuffer).toString('base64');
    } catch (ttsError) {
      console.error("TTS generation failed:", ttsError);
    }

    // ---------------- Send Response ----------------
    res.json({ ...aiResponse, audio: audioBase64 });

  } catch (error) {
    console.error("Error generating content:", error);
    res.status(500).json({
      error: "Failed to generate AI response",
      fallback: {
        query_response: "I'm Rahul Mahatao, your Python instructor. How can I help you with Python programming today?",
        follow_up_questions: [
          "What Python fundamentals would you like to learn?",
          "Do you have any Python coding questions?",
          "Interested in Python career guidance?"
        ],
        audio: null
      }
    });
  }
});

export default router;

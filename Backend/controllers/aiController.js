import { detectLanguage, toBase64 } from '../utils/helpers.js';
import { generateGemini } from '../services/geminiService.js';
import { ttsElevenLabs } from '../services/ttsService.js';

export const askQuestion = async (req, res) => {
  const { question } = req.body;
  if (!question) return res.status(400).json({ error: 'Question is required' });

  try {
    const detectedLang = detectLanguage(question);
    const rawText = await generateGemini(detectedLang, question);

    if (!rawText) {
      return res.json({ 
        query_response: 'Technical issue', 
        follow_up_questions: [], 
        audio: null, 
        detected_language: detectedLang
      });
    }

    let aiResponse;
    try { aiResponse = JSON.parse(rawText); }
    catch { aiResponse = { query_response: rawText, follow_up_questions: [] }; }

    const audioBase64 = await ttsElevenLabs(aiResponse.query_response);
    res.json({ ...aiResponse, audio: audioBase64, detected_language: detectedLang });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed', audio: null });
  }
};

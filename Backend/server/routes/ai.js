import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fetch from 'node-fetch';

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

// Enhanced language detection
function detectLanguage(text) {
  const cleanText = text.toLowerCase().trim();
  
  // Hindi patterns - more specific
  const hindiPatterns = [
    /[\u0900-\u097F]/, // Devanagari script
    /\b(kya|hai|hoon|main|aap|tumhe|kaise|kaha|kahan|kyun|kab|seekhna|chahiye|batao|samjhao|sikhaiye|help|madad)\b/,
    /\b(mujhe|hume|apko|tumko|hamko|iska|uska|ye|wo|yeh|woh|koi|kuch|sab|sabhi)\b/,
    /\b(python|programming|code|variable|function|loop|array|list|dictionary)\b/
  ];
  
  // Bhojpuri patterns - more specific
  const bhojpuriPatterns = [
    /\b(ka|baa|haw|rahe|rahela|kaise|batawa|samjhawa|sikhawa|seekhe|chaahi|chahiye|madad|help)\b/,
    /\b(hamar|tohar|unkar|hamka|tohka|iska|ukar|ye|oo|ei|oi|koi|kuch|sab)\b/,
    /\b(bujhaib|sikhayib|batayib|samjhayib|karela|karta|kare|python|programming)\b/
  ];
  
  // Bengali patterns - more specific  
  const bengaliPatterns = [
    /[\u0980-\u09FF]/, // Bengali script
    /\b(ki|kemon|ache|ami|tumi|apni|kothay|kivabe|keno|kobe|shikhte|chai|help|bolo|bojhao|shikhao)\b/,
    /\b(amar|tomar|tar|amra|tomra|eta|ota|ei|oi|keu|kono|kichhu|shob|shobai)\b/,
    /\b(python|programming|code|variable|function|loop|array|list|dictionary|shikhbo|korbo)\b/
  ];
  
  // English patterns - add specific English indicators
  const englishPatterns = [
    /\b(what|how|when|where|why|who|can|could|would|should|will|do|does|did|is|are|was|were)\b/,
    /\b(python|programming|code|variable|function|loop|array|list|dictionary|learn|teach|help|explain)\b/,
    /\b(please|thank|thanks|sorry|hello|hi|hey|good|bad|yes|no|ok|okay)\b/,
    /\b(i|you|he|she|it|we|they|me|him|her|us|them|my|your|his|her|our|their)\b/
  ];
  
  // Count matches with weights
  let hindiScore = 0;
  let bhojpuriScore = 0;
  let bengaliScore = 0;
  let englishScore = 0;
  
  hindiPatterns.forEach(pattern => {
    const matches = cleanText.match(pattern);
    if (matches) hindiScore += matches.length || 1;
  });
  
  bhojpuriPatterns.forEach(pattern => {
    const matches = cleanText.match(pattern);
    if (matches) bhojpuriScore += matches.length || 1;
  });
  
  bengaliPatterns.forEach(pattern => {
    const matches = cleanText.match(pattern);
    if (matches) bengaliScore += matches.length || 1;
  });
  
  englishPatterns.forEach(pattern => {
    const matches = cleanText.match(pattern);
    if (matches) englishScore += matches.length || 1;
  });
  
  console.log(`Language scores - Hindi: ${hindiScore}, Bhojpuri: ${bhojpuriScore}, Bengali: ${bengaliScore}, English: ${englishScore}`);
  
  // Determine dominant language with better logic
  const maxScore = Math.max(hindiScore, bhojpuriScore, bengaliScore, englishScore);
  
  if (maxScore === 0) return 'english'; // Default fallback
  if (englishScore === maxScore) return 'english';
  if (bengaliScore === maxScore) return 'bengali';
  if (bhojpuriScore === maxScore && bhojpuriScore > hindiScore) return 'bhojpuri';
  if (hindiScore === maxScore) return 'hindi';
  
  return 'english'; // Final fallback
}

const getRahulPrompt = (question) => {
  const detectedLang = detectLanguage(question);
  
  let languageInstruction = '';
  switch(detectedLang) {
    case 'hindi':
      languageInstruction = 'Reply in Hinglish - Use Hindi words written in ENGLISH letters only. Mix English and Hindi naturally. Example: "Python seekhna easy hai, bas practice karo regularly."';
      break;
    case 'bhojpuri':
      languageInstruction = 'Reply in Bhojpuri written in ENGLISH letters only. Use Bhojpuri words but write in English alphabet. Example: "Python sikhe ke ba easy, bas practice kara roj."';
      break;
    case 'bengali':
      languageInstruction = 'Reply in Bengali written in ENGLISH letters only. Use Bengali words but write in English alphabet. Example: "Python shekha easy, khali practice koro regularly."';
      break;
    default:
      languageInstruction = 'Reply in simple, clear English only.';
  }
  
  return `You are Rahul Mahatao, a Python instructor at Techno India University and TCS professional.
You are friendly, witty, and explain concepts clearly.

STRICT LANGUAGE RULE: 
Detected language: ${detectedLang.toUpperCase()}
${languageInstruction}

RESPONSE RULES:
1. Response must be SHORT and TO THE POINT (30-80 words maximum)
2. Use ONLY ENGLISH LETTERS - no Devanagari, no Bengali script, no other scripts
3. Give ONLY ONE response in detected language - NO repetition
4. Include code example ONLY if absolutely necessary (max 2-3 lines)
5. Add light humor but stay focused
6. Must be valid JSON format

JSON Format:
{
  "query_response": "short answer in ${detectedLang} using ENGLISH letters only",
  "follow_up_questions": ["q1","q2","q3"]
}

Student question: "${question}"`;
};

// --- Gemini helper with better JSON enforcement ---
async function generateGemini25Pro(prompt) {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 300, // Reduced for shorter responses
        responseMimeType: "application/json" // Force JSON response
      }
    });
    
    const result = await model.generateContent([prompt]);

    const text =
      result?.response?.text?.() ||
      result?.response?.candidates?.[0]?.content?.parts?.[0]?.text ||
      null;

    if (!text) {
      console.error("⚠️ Gemini returned no text:", JSON.stringify(result, null, 2));
    }

    return text;
  } catch (err) {
    console.error("Gemini error:", err.message || err);
    return null;
  }
}

// --- ElevenLabs TTS ---
async function ttsElevenLabs(text) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID;
  if (!apiKey || !voiceId) {
    console.error("❌ Missing ELEVENLABS_API_KEY or ELEVENLABS_VOICE_ID");
    return null;
  }

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`;
  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg'
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { 
          stability: 0.5, 
          similarity_boost: 0.8,
          style: 0.2 // Add slight style for better regional pronunciation
        }
      })
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error("❌ ElevenLabs TTS failed:", resp.status, resp.statusText, errText);
      return null;
    }

    const arrayBuffer = await resp.arrayBuffer();
    return toBase64(arrayBuffer);
  } catch (err) {
    console.error("❌ TTS error:", err);
    return null;
  }
}

// --- Express Route ---
router.post('/ask', async (req, res) => {
  const { question } = req.body || {};
  if (!question) return res.status(400).json({ error: 'Question is required' });

  try {
    const detectedLang = detectLanguage(question);
    console.log(`🌐 Detected language: ${detectedLang} for question: "${question.slice(0, 50)}..."`);
    
    let rawText = await generateGemini25Pro(getRahulPrompt(question));
    if (!rawText) {
      // Language-specific fallback
      const fallbackResponses = {
        hindi: {
          query_response: "Sorry, main abhi busy hoon. Thoda wait karo!",
          follow_up_questions: ["Python basics?", "Code help?", "Aur sawaal?"]
        },
        bhojpuri: {
          query_response: "Maafi chaahi, abhi system mein problem baa. Thoda der baad try kara!",
          follow_up_questions: ["Python seekhe ke?", "Code help?", "Aur kuch?"]
        },
        bengali: {
          query_response: "Sorry, abhi technical problem ache. Ektu pore try koro!",
          follow_up_questions: ["Python shikhbe?", "Code help?", "Aro kichhu?"]
        },
        english: {
          query_response: "Sorry, having technical issues. Please try again later!",
          follow_up_questions: ["Python basics?", "Code help?", "Other questions?"]
        }
      };
      
      return res.status(500).json({ 
        ...fallbackResponses[detectedLang], 
        audio: null,
        detected_language: detectedLang 
      });
    }

    // Clean and parse JSON
    let cleanText = rawText.replace(/```json|```/g, '').trim();
    
    let aiResponse;
    try {
      aiResponse = JSON.parse(cleanText);
    } catch {
      console.warn("JSON parse failed. Trying repair...");
      
      // Simple repair attempt
      const repairPrompt = `Fix this JSON to be valid:
${cleanText}

Required format:
{"query_response": "answer", "follow_up_questions": ["q1","q2","q3"]}`;
      
      const repairRaw = await generateGemini25Pro(repairPrompt);
      try {
        aiResponse = JSON.parse(repairRaw?.replace(/```json|```/g, '').trim() || '{}');
      } catch {
        // Final fallback with detected language
        const responses = {
          hindi: "Main Python sikhane mein help kar sakta hoon! Kya chahiye?",
          bhojpuri: "Ham Python sikhawe mein help kar sakila! Ka chaahi?",
          bengali: "Ami Python shekhanote help korte pari! Ki lagbe?",
          english: "I can help you learn Python! What do you need?"
        };
        
        aiResponse = {
          query_response: responses[detectedLang] || responses.english,
          follow_up_questions: ["Try again?", "Different question?", "Need help?"]
        };
      }
    }

    // Generate audio
    const audioBase64 = await ttsElevenLabs(aiResponse.query_response);
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json({ 
      ...aiResponse, 
      audio: audioBase64,
      detected_language: detectedLang 
    });
    
  } catch (err) {
    console.error("Error generating AI:", err);
    res.status(500).json({ error: 'Failed', audio: null });
  }
});

export default router;
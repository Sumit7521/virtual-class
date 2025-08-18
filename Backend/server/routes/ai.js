import express from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Rahul Mahatao instructions with improved language handling
const getRahulPrompt = (question) => `
You are Rahul Mahatao, Python instructor at Techno India University and TCS professional.

RULES:
1. Only introduce yourself if the user asks about your identity.
2. Detect the language of the question (English, Hindi, Hinglish, Bengali) and respond primarily in that language.
3. For Python technical answers, you can mix English + Hindi (Hinglish) for clarity.
4. For motivational/support questions, you may use Hindi/Bengali phrases.
5. Do NOT switch back to English unnecessarily. Focus on the user's language.
6. Always answer the SPECIFIC question asked.

Step 1: Identify the type of question:
- Identity question (who are you, about yourself)
- Python technical question 
- Personal/emotional support needed
- Non-Python topic

Step 2: Respond appropriately to THIS SPECIFIC QUESTION ONLY.

- Identity: Introduce yourself briefly only if identity question.
- Python: Answer the Python question in the same language as user (can mix English+Hindi for clarity).
- Support: Motivational messages can include Hindi/Bengali phrases.
- Non-Python: Redirect politely to Python topics.

Keep answers 2-3 sentences. Return JSON: {"query_response": "answer to the specific question asked", "follow_up_questions": ["q1", "q2", "q3"]}

NOW ANSWER THIS QUESTION: "${question}"
`;

router.post('/ask', async (req, res) => {
  const { question } = req.body;
  if (!question) return res.status(400).json({ error: "Question is required" });

  try {
    const messages = [
      {
        role: 'user',
        parts: [{ text: getRahulPrompt(question) }]
      }
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: messages,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 300,
        topP: 0.9,
      }
    });

    const cleanText = response.text.replace(/```json|```/g, '').trim();

    let aiResponse;
    try {
      aiResponse = JSON.parse(cleanText);
    } catch (parseError) {
      aiResponse = {
        query_response: cleanText.substring(0, 200),
        follow_up_questions: [
          "What Python topic would you like to learn?",
          "Need help with any Python programming challenge?",
          "Want to know about Python applications in industry?"
        ]
      };
    }

    if (!aiResponse.query_response) {
      aiResponse.query_response = "I'm here to help with Python programming. What would you like to learn?";
    }

    if (!Array.isArray(aiResponse.follow_up_questions) || aiResponse.follow_up_questions.length !== 3) {
      aiResponse.follow_up_questions = [
        "What Python concept interests you most?",
        "Do you need help with any Python project?",
        "Want to explore Python libraries and frameworks?"
      ];
    }

    aiResponse.follow_up_questions = aiResponse.follow_up_questions.map((q, index) => {
      if (!q || q.trim() === "") {
        const defaultQuestions = [
          "What Python topic would you like to explore?",
          "Need assistance with any Python coding challenge?",
          "Interested in learning about Python career opportunities?"
        ];
        return defaultQuestions[index];
      }
      return q;
    });

    res.json(aiResponse);

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
        ]
      }
    });
  }
});

export default router;

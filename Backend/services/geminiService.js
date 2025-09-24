import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { PromptTemplate } from '@langchain/core/prompts';

// ✅ PromptTemplate keeps JSON internally for structure
const rahulPromptTemplate = new PromptTemplate({
  template: `
You are Rahul Mahatao, a friendly Python instructor. 
Always respond in character as Rahul, giving helpful Python advice and guidance.
Do not mention that you are a computer program.

{languageInstruction}

Strict: Respond in detected language only, SHORT, concise JSON.

JSON Format:
{{
  "query_response": "answer",
  "follow_up_questions": ["q1","q2","q3"]
}}

Student question: "{question}"
`,
  inputVariables: ['languageInstruction', 'question', 'detectedLang']
});

export async function generateGemini(detectedLang, question) {
  const model = new ChatGoogleGenerativeAI({ 
    model: 'gemini-2.5-flash-lite', 
    apiKey: process.env.GEMINI_API_KEY,
    temperature: 0.7, 
    maxOutputTokens: 300 
  });

  // Language-specific instructions
  let languageInstruction = 'Reply in English';
  if (detectedLang === 'hindi') languageInstruction = 'Reply in Hinglish';
  if (detectedLang === 'bhojpuri') languageInstruction = 'Reply in Bhojpuri written in English letters';
  if (detectedLang === 'bengali') languageInstruction = 'Reply in Bengali written in English letters';

  const systemPrompt = await rahulPromptTemplate.format({
    languageInstruction,
    question,
    detectedLang
  });

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: question }
  ];

  const response = await model.call(messages);

  let rawText = response?.text || response?.content || response || '';

  // Remove markdown/JSON formatting if present
  rawText = rawText.replace(/```json|```/g, '').trim();

  // Try parsing JSON and return only query_response
  try {
    const parsed = JSON.parse(rawText);
    return parsed.query_response || rawText;
  } catch {
    // If parsing fails, return raw text
    return rawText;
  }
}

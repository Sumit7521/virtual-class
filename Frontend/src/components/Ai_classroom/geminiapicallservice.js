// frontend/services/GeminiApiCallService.js

const API_URL = "http://localhost:3000/api/ask"; // Ensure your backend is running on this URL

/**
 * Sends a question to the backend AI server and returns the full response.
 * @param {string} question - The question to ask the AI
 * @returns {Promise<Object>} - The AI's response object with query_response and follow_up_questions
 */
export async function askAI(question) {
  if (!question) throw new Error("Question is required");

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ question }),
    });

    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      throw new Error("Failed to parse AI response as JSON");
    }

    if (!response.ok) {
      throw new Error(data.error || "Failed to get AI response");
    }

    // Validate response structure
    if (!data.query_response || !Array.isArray(data.follow_up_questions)) {
      throw new Error("Invalid AI response structure");
    }

    return data;
  } catch (error) {
    console.error("Error calling AI API:", error);
    throw error;
  }
}

/**
 * Returns just the main AI answer text
 * @param {string} question
 * @returns {Promise<string>}
 */
export async function askAIText(question) {
  const response = await askAI(question);
  return response.query_response;
}

/**
 * Returns both answer and follow-up questions in a formatted object
 * @param {string} question
 * @returns {Promise<{answer: string, followUpQuestions: string[]}>}
 */
export async function askAIWithFollowUp(question) {
  const response = await askAI(question);
  return {
    answer: response.query_response,
    followUpQuestions: response.follow_up_questions
  };
}

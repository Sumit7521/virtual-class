const API_URL = "https://immersio-n347.vercel.app/api/ask"; // Backend endpoint

/**
 * Sends a question to the backend AI server and returns the full response.
 * Includes text and TTS audio in base64.
 * @param {string} question - The question to ask the AI
 * @returns {Promise<Object>} - The AI's response object with query_response, follow_up_questions, and audio
 */
export async function askAI(question) {
  if (!question) throw new Error("Question is required");

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });

    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      throw new Error("Failed to parse AI response as JSON");
    }

    if (!response.ok) throw new Error(data.error || "Failed to get AI response");

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
 * @returns {Promise<{answer: string, followUpQuestions: string[], playAudio: function}>}
 */
export async function askAIWithFollowUpAndAudio(question) {
  const response = await askAI(question);

  // Function to play TTS audio
  const playAudio = () => {
    if (response.audio) {
      const audio = new Audio("data:audio/mp3;base64," + response.audio);
      audio.play().catch(err => console.error("Audio play failed:", err));
    }
  };

  return {
    answer: response.query_response,
    followUpQuestions: response.follow_up_questions,
    playAudio,
  };
}

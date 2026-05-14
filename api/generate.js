export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. Get the securely stored API key from Vercel Environment Variables
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'API key is not configured on the server.' });
    }

    // 2. Extract the data sent from our frontend
    const { industry, role, goal } = req.body;

    const prompt = `
You are a premium AI Workflow Architect.
Your task is to generate a highly practical, step-by-step AI workflow for a professional.

User Context:
- Industry: ${industry}
- Role: ${role}
- Goal/Task: ${goal}

Requirements:
1. Provide a title for the workflow.
2. Outline 2 to 4 actionable steps to accomplish this goal using AI tools (e.g., ChatGPT, Claude, Canva, Gamma).
3. For each step, include:
   - The Step Name.
   - The Recommended AI Tool.
   - A precise, ready-to-copy Prompt formatted in a Markdown code block.
   - The expected output.
4. Keep the text concise, professional, and visually easy to read (use headings, bold text, and bullet points).
5. At the end, state the "Estimated Time Saved".

Format exactly using Markdown. Do not include introductory fluff.
`;

    // 3. Call the Google Gemini API directly from the server securely
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.7,
        }
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || "Failed to call Gemini API");
    }

    const data = await response.json();
    const resultText = data.candidates[0].content.parts[0].text;

    // 4. Send the successful result back to the frontend
    return res.status(200).json({ result: resultText });

  } catch (error) {
    console.error('Error generating workflow:', error);
    return res.status(500).json({ error: error.message || 'An error occurred' });
  }
}

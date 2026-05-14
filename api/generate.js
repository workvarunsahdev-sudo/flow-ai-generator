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

You MUST return ONLY a JSON object exactly matching this structure (no markdown, no backticks, no other text):
{
  "title": "Title of the workflow",
  "steps": [
    {
      "title": "Step Name",
      "time": "15 min",
      "desc": "A brief, professional explanation of what we are doing in this step.",
      "tool": "Name of AI Tool (e.g. ChatGPT, Claude, Canva)",
      "output": "What the user gets (e.g. A 500-word draft)",
      "prompt": "The precise, ready-to-copy prompt here. No markdown code blocks inside this string."
    }
  ]
}
Outline 3 to 5 actionable steps. Ensure the JSON is valid and parsable.
`;

    // 3. Call the Google Gemini API directly from the server securely
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
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
    let resultText = data.candidates[0].content.parts[0].text;
    
    // Clean markdown block if Gemini included it
    resultText = resultText.replace(/^```json/g, '').replace(/^```/g, '').replace(/```$/g, '').trim();
    
    const parsedJson = JSON.parse(resultText);

    // 4. Send the successful result back to the frontend
    return res.status(200).json({ result: parsedJson });

  } catch (error) {
    console.error('Error generating workflow:', error);
    return res.status(500).json({ error: error.message || 'An error occurred' });
  }
}

// src/lib/gemini.js
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const MODEL_NAME = "gemini-2.5-flash"; // Using flash for fast JSON generation

export const parseSyllabusWithAI = async (syllabusText) => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${GEMINI_API_KEY}`;
  
  const prompt = `
  You are an expert academic planner.
  Convert the following syllabus text into a structured JSON strictly matching this format. 
  DO NOT wrap the response in markdown blocks like \`\`\`json. Return ONLY valid JSON.
  
  Format:
  [
    {
      "name": "string (topic name)",
      "difficulty": "string (easy, medium, hard - guess based on typical computer science/college difficulty)",
      "estimated_hours": number (realistic hours to study this, e.g. 1.5, 2, 4)
    }
  ]
  
  Syllabus Text:
  ${syllabusText}
  `;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
            temperature: 0.1, // Low temp for structured data
        }
      })
    });

    if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const resultText = data.candidates[0].content.parts[0].text;
    
    // Clean up markdown wrapping if the AI ignored instructions
    const cleanedText = resultText.replace(/```json\n?/, '').replace(/```\n?/, '').trim();
    
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("Syllabus parsing failed:", error);
    throw error;
  }
};

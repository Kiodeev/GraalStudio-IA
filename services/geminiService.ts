
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateArtReference = async (prompt: string): Promise<string | null> => {
  const ai = getAI();
  const fullPrompt = `Pixel art for Graal Online Classic, ${prompt}. Focus on head or body templates, 32x32 or 32x64 style, sharp outlines, vibrant colors, game asset look.`;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: fullPrompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
        },
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Reference generation error:", error);
    return null;
  }
};

export const critiqueArt = async (imageData: string): Promise<string> => {
  const ai = getAI();
  const base64Data = imageData.split(',')[1];
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/png',
              data: base64Data,
            },
          },
          {
            text: `You are a professional pixel artist for Graal Online Classic. Evaluate this art. 
            Critique the following:
            1. Shading (avoid pillow shading).
            2. Color Palette (balance and contrast).
            3. Anatomy/Proportions (standard Graal heads are 32x32).
            4. Detail level.
            Provide constructive feedback in Markdown format.`
          },
        ],
      },
    });

    return response.text || "Could not generate critique.";
  } catch (error) {
    console.error("Critique error:", error);
    return "Error contacting the AI artist.";
  }
};

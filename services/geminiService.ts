
import { GoogleGenAI } from "@google/genai";

export const generateArtReference = async (prompt: string): Promise<string | null> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const fullPrompt = `Crie um asset de pixel art para o jogo Graal Online Classic. O item deve ser: ${prompt}. Estilo: 32x32 pixels, fundo transparente (ou preto para fácil remoção), cores vibrantes, sombreamento simples de jogo retro.`;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: fullPrompt }] },
      config: { 
        imageConfig: { 
          aspectRatio: "1:1"
        } 
      },
    });

    const candidates = response.candidates;
    if (candidates && candidates.length > 0) {
      for (const part of candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    return null;
  } catch (error) {
    console.error("Erro na Geração IA:", error);
    return null;
  }
};

export const critiqueArt = async (imageData: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const base64Data = imageData.includes(',') ? imageData.split(',')[1] : imageData;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/png', data: base64Data } },
          { text: "Você é um mestre de pixel art do Graal Online. Avalie esta imagem tecnicamente em português. Fale sobre: 1. AA (Anti-aliasing), 2. Sombreamento (evite pillow shading), 3. Cores, 4. Anatomia se for cabeça/corpo. Seja direto e encorajador." }
        ],
      },
    });
    // IMPORTANTE: .text é uma propriedade, não um método
    return response.text || "O Mestre está sem palavras no momento.";
  } catch (error) {
    console.error("Erro na Crítica IA:", error);
    return "Ocorreu um erro ao consultar o Mestre Pixel. Verifique sua conexão.";
  }
};

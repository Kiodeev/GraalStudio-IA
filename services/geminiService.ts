
import { GoogleGenAI } from "@google/genai";

const getApiKey = () => {
  if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
    return process.env.API_KEY;
  }
  return "";
};

export const generateArtReference = async (prompt: string): Promise<string | null> => {
  const apiKey = getApiKey();
  if (!apiKey) return null;
  
  const ai = new GoogleGenAI({ apiKey });
  const fullPrompt = `Gere uma referência profissional de pixel art para assets do jogo Graal Online Classic. Descrição: ${prompt}. Estilo: 16-bit, sombras nítidas, sem dithering excessivo, fundo preto sólido. Focado em visibilidade mobile.`;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: fullPrompt }] },
    });

    const candidates = response.candidates;
    if (candidates && candidates.length > 0) {
      const parts = candidates[0].content.parts;
      for (const part of parts) {
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
  const apiKey = getApiKey();
  if (!apiKey) return "API Key não configurada.";

  const ai = new GoogleGenAI({ apiKey });
  const base64Data = imageData.includes(',') ? imageData.split(',')[1] : imageData;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/png', data: base64Data } },
          { text: `Você é o Mestre Wickler, o maior especialista em Pixel Art para Graal Online Classic.
          Sua análise deve ser EXTREMAMENTE TÉCNICA e RÍGIDA.
          
          FOCO DA ANÁLISE:
          1. Jaggies: Identifique onde as curvas não estão suaves.
          2. Banding: Avise se o degradê de cores está formando blocos feios.
          3. Orphan Pixels: Aponte pixels sujos ou isolados que não fazem sentido.
          4. Readability: Diga se o sprite é visível no tamanho original do jogo (32x32).
          5. Shading: Verifique se a luz é consistente.
          
          ESTILO DE RESPOSTA:
          Seja direto, profissional e dê 3 passos concretos para melhorar esta arte imediatamente. Use termos técnicos de pixel art. Português.` }
        ],
      },
    });
    return response.text || "O Mestre está observando... mas nada disse.";
  } catch (error) {
    console.error("Erro na Crítica IA:", error);
    return "Ocorreu uma interferência no Oráculo. Tente novamente.";
  }
};

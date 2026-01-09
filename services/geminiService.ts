
import { GoogleGenAI } from "@google/genai";

const getApiKey = () => {
  // Verifica de forma segura se process e process.env existem antes de acessar
  if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
    return process.env.API_KEY;
  }
  // No navegador puro, process pode não existir.
  // A plataforma injeta a chave, mas o código deve ser resiliente.
  return "";
};

export const generateArtReference = async (prompt: string): Promise<string | null> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn("API Key não detectada. Verifique as configurações de ambiente.");
    return null;
  }
  
  const ai = new GoogleGenAI({ apiKey });
  const fullPrompt = `Crie um asset de pixel art para o jogo Graal Online Classic. O item deve ser: ${prompt}. Estilo: 32x32 pixels, fundo transparente ou preto, cores vibrantes, sombreamento de jogo retro.`;
  
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
  if (!apiKey) return "Aviso: API Key não configurada. A análise não pôde ser iniciada.";

  const ai = new GoogleGenAI({ apiKey });
  const base64Data = imageData.includes(',') ? imageData.split(',')[1] : imageData;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/png', data: base64Data } },
          { text: "Você é um mestre de pixel art do Graal Online Classic. Avalie esta imagem tecnicamente. Fale sobre: 1. AA, 2. Sombreamento, 3. Cores, 4. Anatomia. Seja direto e encorajador em português." }
        ],
      },
    });
    return response.text || "O Mestre não conseguiu analisar esta peça.";
  } catch (error) {
    console.error("Erro na Crítica IA:", error);
    return "O Mestre encontrou um erro técnico na conexão.";
  }
};

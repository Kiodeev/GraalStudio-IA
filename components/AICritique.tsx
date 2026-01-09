
import React, { useState, useEffect } from 'react';
import { critiqueArt } from '../services/geminiService';
import { playSound } from '../services/audioService';

interface AICritiqueProps {
  externalImage?: string | null;
  onImageProcessed?: () => void;
}

const AICritique: React.FC<AICritiqueProps> = ({ externalImage, onImageProcessed }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (externalImage) {
      setSelectedImage(externalImage);
      setFeedback(null);
      handleCritiqueInternal(externalImage);
      if (onImageProcessed) onImageProcessed();
    }
  }, [externalImage]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setFeedback(null);
        playSound.success();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCritiqueInternal = async (img: string) => {
    setLoading(true);
    try {
      const result = await critiqueArt(img);
      setFeedback(result);
      playSound.magic();
    } catch (e) {
      setFeedback("O Mestre está meditando profundamente. Tente em breve.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto h-full flex flex-col">
      <div className="mb-8 shrink-0">
        <h2 className="text-4xl md:text-6xl font-black text-rose-500 tracking-tighter uppercase">MESTRE <span className="text-white">PIXEL</span></h2>
        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em] mt-2">Neural expertise for retro graphics</p>
      </div>

      <div className="flex-1 flex flex-col lg:grid lg:grid-cols-12 gap-8 min-h-0 overflow-hidden">
        {/* Coluna de Visualização (Fixa no Topo no Mobile) */}
        <div className="lg:col-span-5 flex flex-col gap-6 shrink-0">
          <div className="aspect-square bg-zinc-900 rounded-[3rem] border-4 border-zinc-800 flex items-center justify-center overflow-hidden relative shadow-2xl group transition-all duration-500 hover:border-rose-500/30">
            {selectedImage ? (
              <div className="w-full h-full p-12 flex items-center justify-center bg-zinc-950/50">
                <img src={selectedImage} alt="Arte" className="max-w-full max-h-full object-contain pixel-render scale-150 shadow-2xl" />
              </div>
            ) : (
              <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full text-zinc-700 hover:bg-zinc-800/20 transition-all">
                <span className="text-7xl mb-4 grayscale opacity-30">🗿</span>
                <span className="text-xs font-black uppercase tracking-widest">Carregar Obra</span>
                <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
              </label>
            )}
          </div>
          
          <button 
            onClick={() => selectedImage && handleCritiqueInternal(selectedImage)}
            disabled={!selectedImage || loading}
            className="w-full bg-rose-600 py-6 rounded-3xl font-black text-xs uppercase tracking-[0.3em] shadow-xl hover:bg-rose-500 disabled:opacity-30 transition-all active:scale-95 flex items-center justify-center gap-4"
          >
            {loading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : "ANALISAR AGORA"}
          </button>
        </div>

        {/* Coluna de Feedback (Rolagem Independente) */}
        <div className="lg:col-span-7 flex flex-col min-h-0">
          <div className={`flex-1 rounded-[3rem] p-8 md:p-12 border-2 overflow-hidden flex flex-col transition-all duration-700 ${feedback ? 'bg-zinc-900 border-rose-500/20' : 'bg-zinc-900/30 border-zinc-800'}`}>
            <div className="flex items-center gap-3 mb-8 shrink-0">
              <div className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-500 animate-pulse' : feedback ? 'bg-rose-500' : 'bg-zinc-700'}`} />
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Relatório Técnico</span>
            </div>

            <div className="flex-1 overflow-y-auto custom-scroll pr-4">
              {feedback ? (
                <div className="text-zinc-200 text-base md:text-xl leading-relaxed whitespace-pre-wrap font-medium italic animate-in fade-in slide-in-from-bottom-4 duration-700">
                  {feedback}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-20 py-12">
                  <span className="text-6xl mb-6 grayscale">👁️</span>
                  <p className="text-xs font-black uppercase tracking-widest">O Mestre aguarda sua arte</p>
                  <p className="text-[10px] mt-4 max-w-[250px] leading-relaxed">Avaliações sobre cores, sombreamento, AA e anatomia de jogo.</p>
                </div>
              )}
            </div>

            {feedback && (
              <div className="mt-8 pt-6 border-t border-zinc-800/50 flex items-center justify-between shrink-0">
                <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest">Studio v3.5 Professional</span>
                <button onClick={()=>{setFeedback(null); setSelectedImage(null); playSound.tool();}} className="text-[8px] font-black text-zinc-600 uppercase hover:text-white transition-colors">Nova Análise</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AICritique;


import React, { useState, useEffect } from 'react';
import { critiqueArt } from '../services/geminiService';

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
      // Automatically trigger critique for external images
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
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCritiqueInternal = async (img: string) => {
    setLoading(true);
    const result = await critiqueArt(img);
    setFeedback(result);
    setLoading(false);
  };

  const handleCritique = () => {
    if (selectedImage) handleCritiqueInternal(selectedImage);
  };

  return (
    <div className="max-w-5xl mx-auto p-8 bg-slate-900 rounded-[2rem] border border-slate-800 shadow-3xl">
      <div className="flex flex-col md:flex-row items-start justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black mb-2 text-rose-400 flex items-center gap-3">
            <span className="bg-rose-500/20 p-2 rounded-lg">👁️</span> Avaliador Mestre IA
          </h2>
          <p className="text-slate-400">Analise técnica focada em Pixel Art para Graal Online.</p>
        </div>
        {selectedImage && (
          <button 
            onClick={() => {setSelectedImage(null); setFeedback(null);}}
            className="text-xs font-bold text-slate-500 hover:text-white uppercase tracking-tighter"
          >
            Limpar Imagem
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="aspect-square bg-slate-950 rounded-2xl border-2 border-dashed border-slate-800 flex items-center justify-center overflow-hidden relative group shadow-inner">
            {selectedImage ? (
              <img src={selectedImage} alt="Preview" className="w-full h-full object-contain image-render-pixel" style={{ imageRendering: 'pixelated' }} />
            ) : (
              <label className="cursor-pointer flex flex-col items-center text-slate-600 hover:text-rose-400 transition-all p-12 text-center">
                <span className="text-6xl mb-4">🖼️</span>
                <span className="font-bold">Solte sua arte aqui</span>
                <span className="text-sm opacity-50 mt-1">PNG ou JPG (32x32 recomendado)</span>
                <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
              </label>
            )}
          </div>
          
          <button 
            onClick={handleCritique}
            disabled={!selectedImage || loading}
            className="w-full bg-gradient-to-r from-rose-600 to-pink-600 py-4 rounded-2xl font-black text-lg hover:shadow-2xl hover:shadow-rose-500/30 disabled:opacity-30 transition-all flex items-center justify-center gap-3"
          >
            {loading ? (
              <>
                <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                O Mestre está observando...
              </>
            ) : (
              <>🚀 Solicitar Avaliação Técnica</>
            )}
          </button>
        </div>

        <div className="lg:col-span-7">
          <div className={`h-full min-h-[400px] rounded-2xl p-8 border border-slate-800 transition-all ${feedback ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-900/50 border-transparent'}`}>
            <h3 className="font-bold text-slate-400 mb-6 flex items-center gap-2 uppercase text-xs tracking-[0.2em]">
              Relatório de Análise
            </h3>
            {feedback ? (
              <div className="prose prose-invert prose-rose max-w-none">
                <div className="bg-slate-950/50 p-6 rounded-xl border border-slate-700 leading-relaxed text-slate-300 font-medium italic">
                  {feedback}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center opacity-30">
                 <span className="text-8xl block mb-6 grayscale">🗿</span>
                 <p className="max-w-[200px] text-sm">O Mestre aguarda sua obra para proferir sua sabedoria.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AICritique;

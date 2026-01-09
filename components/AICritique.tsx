
import React, { useState, useEffect } from 'react';
import { critiqueArt } from '../services/geminiService.ts';
import { playSound } from '../services/audioService.ts';

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
    <div className="max-w-5xl mx-auto h-full flex flex-col pb-20">
      <div className="mb-12 shrink-0">
        <h2 className="text-4xl md:text-6xl font-black text-indigo-500 tracking-tighter uppercase">MESTRE <span className="text-white">PIXEL</span></h2>
        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.5em] mt-3">Advanced feedback for retro artists</p>
      </div>

      <div className="flex-1 flex flex-col lg:grid lg:grid-cols-12 gap-12 min-h-0 overflow-hidden">
        <div className="lg:col-span-5 flex flex-col gap-8 shrink-0">
          <div className="aspect-square bg-zinc-900 rounded-[50px] border border-zinc-800 flex items-center justify-center overflow-hidden relative shadow-2xl group transition-all duration-700 hover:border-indigo-500/40">
            {selectedImage ? (
              <div className="w-full h-full p-16 flex items-center justify-center bg-zinc-950/30">
                <img src={selectedImage} alt="Arte" className="max-w-full max-h-full object-contain pixel-render scale-150 shadow-2xl transition-transform duration-500 group-hover:scale-[1.6]" />
              </div>
            ) : (
              <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full text-zinc-700 hover:bg-zinc-800/10 transition-all">
                <span className="text-7xl mb-6 grayscale opacity-20">🗿</span>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Upload Masterpiece</span>
                <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
              </label>
            )}
          </div>
          
          <button 
            onClick={() => selectedImage && handleCritiqueInternal(selectedImage)}
            disabled={!selectedImage || loading}
            className="w-full bg-zinc-100 py-6 rounded-3xl font-black text-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-white disabled:opacity-10 transition-all active:scale-95 flex items-center justify-center gap-4"
          >
            {loading ? <div className="w-4 h-4 border-2 border-black/10 border-t-black rounded-full animate-spin" /> : "Request Review"}
          </button>
        </div>

        <div className="lg:col-span-7 flex flex-col min-h-0">
          <div className={`flex-1 rounded-[50px] p-10 md:p-14 border border-zinc-800/60 overflow-hidden flex flex-col transition-all duration-1000 ${feedback ? 'bg-zinc-900 shadow-2xl' : 'bg-zinc-900/20'}`}>
            <div className="flex items-center gap-3 mb-10 shrink-0">
              <div className={`w-2.5 h-2.5 rounded-full ${loading ? 'bg-yellow-500 animate-pulse' : feedback ? 'bg-indigo-500' : 'bg-zinc-800'}`} />
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Master Analysis</span>
            </div>

            <div className="flex-1 overflow-y-auto custom-scroll pr-6">
              {feedback ? (
                <div className="text-zinc-200 text-base md:text-xl leading-relaxed whitespace-pre-wrap font-medium italic animate-in fade-in slide-in-from-bottom-6 duration-1000">
                  {feedback}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-20 py-16">
                  <span className="text-6xl mb-8 grayscale">👁️</span>
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] max-w-[280px] leading-relaxed">The Master awaits your artistic contribution</p>
                </div>
              )}
            </div>

            {feedback && (
              <div className="mt-10 pt-8 border-t border-zinc-800/40 flex items-center justify-between shrink-0">
                <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest">Studio Pro Analysis</span>
                <button onClick={()=>{setFeedback(null); setSelectedImage(null); playSound.tool();}} className="text-[9px] font-bold text-zinc-600 uppercase hover:text-white transition-colors">Clear Result</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AICritique;

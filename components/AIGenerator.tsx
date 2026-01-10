
import React, { useState } from 'react';
import { generateArtReference } from '../services/geminiService.ts';

interface AIGeneratorProps {
  onUseAsRef: (url: string) => void;
}

const AIGenerator: React.FC<AIGeneratorProps> = ({ onUseAsRef }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    const img = await generateArtReference(prompt);
    setResult(img);
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <div className="mb-14 text-center">
        <h2 className="text-4xl md:text-6xl font-black mb-4 tracking-tighter text-white uppercase italic">FORJA <span className="text-indigo-500">STUDIO</span></h2>
        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.5em]">Materialize referências para seus sprites</p>
      </div>
      
      <div className="flex flex-col gap-4 p-8 bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] mb-14 shadow-2xl backdrop-blur-sm">
        <textarea 
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ex: Escudo de diamante azul, Capacete futurista com chifres..."
          className="w-full bg-black/40 border border-zinc-800 rounded-2xl px-6 py-5 focus:outline-none focus:border-indigo-500 transition-colors font-medium text-sm text-zinc-200 min-h-[100px] resize-none"
        />
        <button 
          onClick={handleGenerate}
          disabled={loading || !prompt}
          className="w-full bg-indigo-600 py-5 rounded-2xl font-black hover:bg-indigo-500 disabled:opacity-20 transition-all text-xs uppercase tracking-[0.3em] text-white shadow-2xl shadow-indigo-500/10 active:scale-95"
        >
          {loading ? 'Sintetizando...' : 'Iniciar Alquimia ⚡'}
        </button>
      </div>

      {result && (
        <div className="animate-in fade-in zoom-in duration-700 max-w-sm mx-auto space-y-8">
           <div className="aspect-square bg-zinc-950 rounded-[3rem] p-10 border border-zinc-800 flex items-center justify-center shadow-inner relative overflow-hidden group">
              <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <img src={result} className="w-full h-full pixel-render object-contain z-10" alt="Generated" />
           </div>
           <button 
             onClick={() => onUseAsRef(result)}
             className="w-full py-6 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] shadow-2xl active:scale-95 transition-all"
           >
             Injetar no Editor
           </button>
        </div>
      )}

      {!result && !loading && (
        <div className="text-center opacity-20 py-20 flex flex-col items-center gap-6">
           <span className="text-6xl grayscale">🔮</span>
           <p className="text-[10px] font-black uppercase tracking-[0.4em]">O Laboratório aguarda seu comando</p>
        </div>
      )}
    </div>
  );
};

export default AIGenerator;
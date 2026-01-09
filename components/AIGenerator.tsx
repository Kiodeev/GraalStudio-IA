
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
    <div className="max-w-4xl mx-auto pb-24">
      <div className="mb-14">
        <h2 className="text-4xl md:text-6xl font-black mb-4 tracking-tighter text-zinc-100 uppercase">REFERENCE <span className="text-indigo-500">LAB</span></h2>
        <p className="text-zinc-500 text-sm md:text-base max-w-xl font-medium">Crie bases profissionais com inteligência artificial para servir de guia no seu editor.</p>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 p-2 bg-zinc-900/60 border border-zinc-800 rounded-3xl mb-14 shadow-inner">
        <input 
          type="text" 
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ex: 'Futuristic samurai helmet', 'Obsidian dagger'..."
          className="flex-1 bg-transparent px-6 py-5 focus:outline-none font-medium text-sm text-zinc-200 placeholder:text-zinc-700"
        />
        <button 
          onClick={handleGenerate}
          disabled={loading || !prompt}
          className="bg-indigo-600 px-10 py-5 rounded-2xl font-bold hover:bg-indigo-500 disabled:opacity-20 transition-all text-xs uppercase tracking-[0.2em] text-white shadow-xl shadow-indigo-500/10 active:scale-95"
        >
          {loading ? 'Creating...' : 'Generate'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="bg-zinc-900/30 rounded-[48px] p-10 border border-zinc-800 flex flex-col items-center justify-center min-h-[400px] shadow-sm relative overflow-hidden group">
          <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          {result ? (
            <div className="w-full flex flex-col items-center relative z-10">
              <div className="w-full max-w-[260px] aspect-square bg-zinc-950 rounded-[40px] p-8 mb-10 shadow-2xl flex items-center justify-center border border-zinc-800">
                <img src={result} className="w-full h-full pixel-render" alt="Reference" />
              </div>
              <button 
                onClick={() => onUseAsRef(result)}
                className="w-full py-6 bg-zinc-100 text-black rounded-2xl font-black hover:bg-white transition-all active:scale-95 text-[10px] uppercase tracking-[0.3em] shadow-xl"
              >
                Apply as Overlay
              </button>
            </div>
          ) : (
            <div className="text-zinc-700 text-center py-12">
              <span className="text-7xl block mb-8 grayscale opacity-20">⚡</span>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Awaiting prompt</p>
            </div>
          )}
        </div>

        <div className="space-y-8">
          <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.5em] mb-4">Studio Parameters</h3>
          <TipItem icon="📐" title="Structure" desc="Especifique vistas (front/side) para templates de corpos e cabeças." />
          <TipItem icon="✨" title="Overlay Mode" desc="A imagem aplicada terá 40% de opacidade para facilitar o tracing." />
          <TipItem icon="💎" title="Resolution" desc="Foco em pixel art 32x32 compatível com o padrão do jogo." />
        </div>
      </div>
    </div>
  );
};

const TipItem = ({icon, title, desc}: any) => (
  <div className="flex gap-6 p-7 bg-zinc-900/20 border border-zinc-800/40 rounded-[32px] hover:bg-zinc-900/40 transition-colors">
    <span className="text-2xl">{icon}</span>
    <div>
      <h4 className="text-zinc-200 font-bold text-xs mb-1.5 uppercase tracking-widest">{title}</h4>
      <p className="text-zinc-500 text-[10px] font-medium leading-relaxed">{desc}</p>
    </div>
  </div>
);

export default AIGenerator;

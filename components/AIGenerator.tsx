
import React, { useState } from 'react';
import { generateArtReference } from '../services/geminiService';

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
    <div className="max-w-4xl mx-auto pb-20">
      <div className="mb-12">
        <h2 className="text-3xl md:text-5xl font-black mb-3 tracking-tighter text-zinc-100">BIBLIOTECA <span className="text-indigo-500">IA</span></h2>
        <p className="text-zinc-500 text-sm md:text-base max-w-xl">Gere referências exclusivas e aplique-as como guias transparentes no seu canvas.</p>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3 p-1.5 bg-zinc-900/50 border border-zinc-800 rounded-2xl mb-12 shadow-inner">
        <input 
          type="text" 
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ex: 'Samurai mask', 'Energy sword'..."
          className="flex-1 bg-transparent px-5 py-4 focus:outline-none font-medium text-sm text-zinc-200"
        />
        <button 
          onClick={handleGenerate}
          disabled={loading || !prompt}
          className="bg-indigo-600 px-8 py-4 rounded-xl font-bold hover:bg-indigo-500 disabled:opacity-20 transition-all text-xs uppercase tracking-widest text-white shadow-lg shadow-indigo-500/10 active:scale-95"
        >
          {loading ? 'Processando...' : 'Criar Guia'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="bg-zinc-900/40 rounded-[32px] p-8 border border-zinc-800 flex flex-col items-center justify-center min-h-[350px] shadow-sm">
          {result ? (
            <div className="w-full flex flex-col items-center">
              <div className="w-full max-w-[240px] aspect-square bg-zinc-950 rounded-2xl p-6 mb-8 shadow-2xl flex items-center justify-center border border-zinc-800">
                <img src={result} className="w-full h-full pixel-render" alt="Reference" />
              </div>
              <button 
                onClick={() => onUseAsRef(result)}
                className="w-full py-5 bg-zinc-100 text-black rounded-xl font-bold hover:bg-white transition-all active:scale-95 text-[10px] uppercase tracking-[0.2em] shadow-md"
              >
                Usar como Guia
              </button>
            </div>
          ) : (
            <div className="text-zinc-700 text-center py-10">
              <span className="text-6xl block mb-6 grayscale opacity-20">🎨</span>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-30">Descreva seu item acima</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[0.3em] mb-4">Parâmetros de Estúdio</h3>
          <TipItem icon="📐" title="Templates Reais" desc="Peça por 'front view' para itens de cabeça ou 'side' para espadas." />
          <TipItem icon="✨" title="Modo Fantasma" desc="A imagem aparecerá com 40% de opacidade no seu editor principal." />
          <TipItem icon="💎" title="Qualidade Pro" desc="O sistema foca em pixel art 32x32 com paleta reduzida." />
        </div>
      </div>
    </div>
  );
};

const TipItem = ({icon, title, desc}: any) => (
  <div className="flex gap-4 p-5 bg-zinc-900/20 border border-zinc-800/50 rounded-2xl">
    <span className="text-xl">{icon}</span>
    <div>
      <h4 className="text-zinc-200 font-bold text-xs mb-1 uppercase tracking-wider">{title}</h4>
      <p className="text-zinc-500 text-[10px] leading-relaxed">{desc}</p>
    </div>
  </div>
);

export default AIGenerator;

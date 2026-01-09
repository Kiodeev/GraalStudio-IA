
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
    <div className="max-w-5xl mx-auto pb-20">
      <div className="mb-8 md:mb-12">
        <h2 className="text-3xl md:text-5xl font-black mb-3 md:mb-4 tracking-tighter">BIBLIOTECA DE <span className="text-indigo-500">INSPIRAÇÃO</span></h2>
        <p className="text-zinc-500 text-sm md:text-lg max-w-2xl">Crie bases profissionais para seus itens de Graal e use-as como guia transparente no editor.</p>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 p-2 bg-zinc-900 border border-zinc-800 rounded-2xl mb-12 shadow-2xl">
        <input 
          type="text" 
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ex: 'Samurai head front view', 'Golden sword'..."
          className="flex-1 bg-transparent px-4 py-4 md:px-6 md:py-5 focus:outline-none font-medium text-sm md:text-base"
        />
        <button 
          onClick={handleGenerate}
          disabled={loading || !prompt}
          className="bg-indigo-600 px-8 py-4 md:py-2 rounded-xl font-black hover:bg-indigo-500 disabled:opacity-30 transition-all text-xs md:text-sm uppercase tracking-widest shadow-lg shadow-indigo-500/20 active:scale-95"
        >
          {loading ? 'CRIANDO...' : 'GERAR GUIA'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
        <div className="bg-zinc-900 rounded-3xl p-6 md:p-8 border border-zinc-800 flex flex-col items-center justify-center min-h-[350px] md:min-h-[450px]">
          {result ? (
            <div className="w-full flex flex-col items-center">
              <div className="w-full max-w-[300px] aspect-square bg-zinc-950 rounded-2xl p-4 mb-6 shadow-2xl flex items-center justify-center">
                <img src={result} className="w-full h-full pixel-render shadow-inner" style={{imageRendering:'pixelated'}} alt="Reference" />
              </div>
              <button 
                onClick={() => onUseAsRef(result)}
                className="w-full py-5 bg-white text-black rounded-2xl font-black hover:bg-zinc-200 transition-all active:scale-95 text-xs uppercase tracking-widest shadow-xl"
              >
                APLICAR NO EDITOR
              </button>
            </div>
          ) : (
            <div className="text-zinc-700 text-center">
              <span className="text-7xl md:text-8xl block mb-6 opacity-20">🎨</span>
              <p className="font-bold text-sm md:text-base uppercase tracking-widest opacity-40">Aguardando seu comando artístico...</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <h3 className="text-lg md:text-xl font-bold text-zinc-300 flex items-center gap-2">
            <span className="text-indigo-500">💡</span> Dicas para Melhores Resultados
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
            <FeatureItem title="Especifique a Vista" desc="Para cabeças, use 'front view' ou 'side view' para o template correto." />
            <FeatureItem title="Paleta de Cores" desc="Adicione 'Graal classic palette' ou cores específicas como 'neon green'." />
            <FeatureItem title="Remoção de Fundo" desc="Peça por 'flat black background' para facilitar a transparência no editor." />
            <FeatureItem title="Modo Guia" desc="Ao aplicar, a imagem ficará semi-transparente atrás dos seus pixels." />
          </div>
        </div>
      </div>
    </div>
  );
};

const FeatureItem = ({title, desc}: any) => (
  <div className="p-4 md:p-5 bg-zinc-900/50 border border-zinc-800 rounded-2xl hover:border-zinc-700 transition-colors">
    <h4 className="text-indigo-400 font-bold mb-1 text-sm">{title}</h4>
    <p className="text-zinc-500 text-xs leading-relaxed">{desc}</p>
  </div>
);

export default AIGenerator;

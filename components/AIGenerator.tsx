
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
    <div className="max-w-4xl mx-auto">
      <div className="mb-12">
        <h2 className="text-4xl font-black mb-4 tracking-tighter">BIBLIOTECA DE <span className="text-indigo-500">INSPIRAÇÃO</span></h2>
        <p className="text-zinc-500 text-lg">Crie bases profissionais para seus itens e use-as como guia no canvas.</p>
      </div>
      
      <div className="flex gap-4 p-2 bg-zinc-900 border border-zinc-800 rounded-2xl mb-12 shadow-2xl">
        <input 
          type="text" 
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ex: 'Samurai head with glowing eyes', 'Golden knight armor body'..."
          className="flex-1 bg-transparent px-6 py-4 focus:outline-none font-medium"
        />
        <button 
          onClick={handleGenerate}
          disabled={loading}
          className="bg-indigo-600 px-8 py-4 rounded-xl font-black hover:bg-indigo-500 disabled:opacity-50 transition-all"
        >
          {loading ? 'GERANDO...' : 'CRIAR GUIA'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="bg-zinc-900 rounded-3xl p-8 border border-zinc-800 flex flex-col items-center justify-center min-h-[400px]">
          {result ? (
            <div className="w-full">
              <img src={result} className="w-full aspect-square rounded-xl shadow-2xl pixel-render mb-6" style={{imageRendering:'pixelated'}} />
              <button 
                onClick={() => onUseAsRef(result)}
                className="w-full py-4 bg-white text-black rounded-xl font-black hover:bg-indigo-400 transition"
              >
                USAR COMO GUIA NO EDITOR
              </button>
            </div>
          ) : (
            <div className="text-zinc-700 text-center">
              <span className="text-8xl block mb-4 opacity-10">🎨</span>
              <p className="font-bold">Aguardando seu comando...</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-bold text-zinc-300">Dicas para o melhor Asset:</h3>
          <div className="space-y-4">
            <FeatureItem title="Seja Específico" desc="Use cores e estilos (ex: 'Paleta neon', 'Estilo medieval clássico')." />
            <FeatureItem title="Foque no Tipo" desc="Mencione 'Head front view' ou 'Full body template' para melhores resultados." />
            <FeatureItem title="Trabalhe com o Guia" desc="Após gerar, envie para o Editor e desenhe por cima usando o modo Onion Skin." />
          </div>
        </div>
      </div>
    </div>
  );
};

const FeatureItem = ({title, desc}: any) => (
  <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
    <h4 className="text-indigo-400 font-bold mb-1">{title}</h4>
    <p className="text-zinc-500 text-sm">{desc}</p>
  </div>
);

export default AIGenerator;

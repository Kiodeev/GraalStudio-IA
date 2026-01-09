
import React, { useState } from 'react';
import PixelEditor from './components/PixelEditor';
import AIGenerator from './components/AIGenerator';
import AICritique from './components/AICritique';

export default function App() {
  const [tab, setTab] = useState<'editor' | 'forge' | 'oracle'>('editor');
  const [activeRef, setActiveRef] = useState<string | null>(null);
  const [critiqueImg, setCritiqueImg] = useState<string | null>(null);
  // Estado para persistir o desenho entre as trocas de abas
  const [persistedDrawing, setPersistedDrawing] = useState<string | null>(null);

  const handleUseRef = (url: string) => {
    setActiveRef(url);
    setTab('editor');
  };

  const handleRequestCritique = (url: string) => {
    setCritiqueImg(url);
    setTab('oracle');
  };

  const handleSaveDrawing = (url: string) => {
    setPersistedDrawing(url);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#050505] text-white overflow-hidden font-sans selection:bg-indigo-500/30">
      {/* Wickler Studio Header */}
      <header className="h-16 border-b border-zinc-900 flex items-center justify-between px-6 bg-black/80 backdrop-blur-xl z-[100] shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <span className="font-black text-white italic text-lg">W</span>
          </div>
          <div className="flex flex-col leading-none">
            <h1 className="text-xl font-black tracking-tighter uppercase italic text-white">Wickler Studio</h1>
            <span className="text-[8px] font-bold text-zinc-600 tracking-[0.4em] uppercase">Elite Pixel Engine</span>
          </div>
        </div>

        <nav className="hidden md:flex gap-10">
          <NavBtn active={tab === 'editor'} label="Estúdio" onClick={() => setTab('editor')} />
          <NavBtn active={tab === 'forge'} label="Forja IA" onClick={() => setTab('forge')} />
          <NavBtn active={tab === 'oracle'} label="Oráculo" onClick={() => setTab('oracle')} />
        </nav>

        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
          <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">v2.0.0 Pro</span>
        </div>
      </header>

      {/* Main Area */}
      <main className="flex-1 relative overflow-hidden">
        {/* Renderização condicional mantendo o estado através do persistedDrawing */}
        <div className={tab === 'editor' ? 'h-full' : 'hidden'}>
          <PixelEditor 
            activeReference={activeRef} 
            onCritiqueRequest={handleRequestCritique} 
            initialData={persistedDrawing}
            onAutoSave={handleSaveDrawing}
          />
        </div>
        
        {tab === 'forge' && (
          <div className="p-8 h-full overflow-y-auto custom-scroll">
            <AIGenerator onUseAsRef={handleUseRef} />
          </div>
        )}
        
        {tab === 'oracle' && (
          <div className="p-8 h-full overflow-y-auto custom-scroll">
            <AICritique externalImage={critiqueImg} />
          </div>
        )}
      </main>

      {/* Navigation Mobile */}
      <nav className="md:hidden h-20 bg-black border-t border-zinc-900 flex items-center justify-around safe-pb z-[100]">
        <MobileTab active={tab === 'editor'} icon="🎨" label="Estúdio" onClick={() => setTab('editor')} />
        <MobileTab active={tab === 'forge'} icon="⚡" label="Forja" onClick={() => setTab('forge')} />
        <MobileTab active={tab === 'oracle'} icon="🗿" label="Oráculo" onClick={() => setTab('oracle')} />
      </nav>

      <style>{`
        .custom-scroll::-webkit-scrollbar { width: 4px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #27272a; border-radius: 10px; }
        .pixel-render { image-rendering: pixelated; }
      `}</style>
    </div>
  );
}

const NavBtn = ({ active, label, onClick }: any) => (
  <button
    onClick={onClick}
    className={`text-[10px] font-black uppercase tracking-[0.4em] transition-all relative py-2 ${
      active ? 'text-white' : 'text-zinc-600 hover:text-white'
    }`}
  >
    {label}
    {active && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500" />}
  </button>
);

const MobileTab = ({ active, icon, label, onClick }: any) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-all ${active ? 'scale-110' : 'opacity-40 grayscale'}`}>
    <span className="text-xl">{icon}</span>
    <span className={`text-[8px] font-black uppercase tracking-widest ${active ? 'text-indigo-400' : 'text-zinc-500'}`}>{label}</span>
  </button>
);


import React, { useState } from 'react';
import PixelEditor from './components/PixelEditor';
import AIGenerator from './components/AIGenerator';
import AICritique from './components/AICritique';

export default function App() {
  const [tab, setTab] = useState<'editor' | 'forge' | 'oracle'>('editor');
  const [activeRef, setActiveRef] = useState<string | null>(null);
  const [critiqueImg, setCritiqueImg] = useState<string | null>(null);
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
    <div className="flex flex-col h-[100dvh] w-full bg-black text-white overflow-hidden font-sans selection:bg-indigo-500/30">
      {/* Wickler Studio Header */}
      <header className="h-12 border-b border-zinc-900 flex items-center justify-between px-4 bg-black/95 backdrop-blur-xl z-[150] shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
            <span className="font-black text-white italic text-xs">W</span>
          </div>
          <h1 className="text-xs font-black tracking-tight uppercase italic text-white">Wickler Studio</h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
          <span className="text-[7px] font-black text-zinc-600 uppercase tracking-widest">v2.5 ULTRA</span>
        </div>
      </header>

      {/* Main Area */}
      <main className="flex-1 relative overflow-hidden bg-[#050505]">
        <div className={tab === 'editor' ? 'h-full w-full' : 'hidden'}>
          <PixelEditor 
            activeReference={activeRef} 
            onCritiqueRequest={handleRequestCritique} 
            initialData={persistedDrawing}
            onAutoSave={handleSaveDrawing}
          />
        </div>
        
        {tab === 'forge' && (
          <div className="p-4 h-full overflow-y-auto custom-scroll pb-24">
            <AIGenerator onUseAsRef={handleUseRef} />
          </div>
        )}
        
        {tab === 'oracle' && (
          <div className="p-4 h-full overflow-y-auto custom-scroll pb-24">
            <AICritique externalImage={critiqueImg} />
          </div>
        )}
      </main>

      {/* Main App Navigation (Bottom Tabs) - Fixed on top to avoid UI overlap */}
      <nav className="h-14 bg-zinc-950 border-t border-zinc-900 flex items-center justify-around safe-pb z-[200] shrink-0 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        <MobileTab active={tab === 'editor'} icon="🎨" label="Editor" onClick={() => setTab('editor')} />
        <MobileTab active={tab === 'forge'} icon="⚡" label="Forja" onClick={() => setTab('forge')} />
        <MobileTab active={tab === 'oracle'} icon="🗿" label="Oráculo" onClick={() => setTab('oracle')} />
      </nav>

      <style>{`
        .custom-scroll::-webkit-scrollbar { width: 3px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #27272a; border-radius: 10px; }
        .pixel-render { image-rendering: pixelated; image-rendering: crisp-edges; }
        html, body, #root { height: 100%; overflow: hidden; margin: 0; padding: 0; }
      `}</style>
    </div>
  );
}

const MobileTab = ({ active, icon, label, onClick }: any) => (
  <button onClick={onClick} className={`flex flex-col items-center justify-center transition-all flex-1 h-full ${active ? 'bg-zinc-900/40' : 'opacity-40 grayscale'}`}>
    <span className="text-xl">{icon}</span>
    <span className={`text-[7px] font-black uppercase tracking-[0.2em] mt-0.5 ${active ? 'text-indigo-400' : 'text-zinc-500'}`}>{label}</span>
  </button>
);


import React, { useState } from 'react';
import PixelEditor from './components/PixelEditor.tsx';
import AIGenerator from './components/AIGenerator.tsx';
import AICritique from './components/AICritique.tsx';
import { TabType } from './types.ts';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('editor');
  const [activeReference, setActiveReference] = useState<string | null>(null);
  const [pendingCritique, setPendingCritique] = useState<string | null>(null);

  const handleExport = (dataUrl: string) => {
    const link = document.createElement('a');
    link.download = `graal-item-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  };

  const handleUseRef = (url: string) => {
    setActiveReference(url);
    setActiveTab('editor');
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#09090b] text-zinc-100 overflow-hidden pt-safe">
      {/* Header Studio Carbon */}
      <header className="h-16 bg-[#09090b] border-b border-zinc-800/40 flex items-center justify-between px-6 z-50 shrink-0 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 bg-zinc-100 rounded-xl flex items-center justify-center font-black text-black text-xs shadow-xl">S</div>
          <div className="hidden sm:block">
            <h1 className="text-[10px] font-black tracking-[0.4em] uppercase text-zinc-400">GRAAL <span className="text-white">STUDIO</span></h1>
          </div>
        </div>
        
        <nav className="flex bg-zinc-900/40 p-1 rounded-2xl border border-zinc-800/50">
          <TabBtn active={activeTab==='editor'} onClick={()=>setActiveTab('editor')} icon="🖌️" label="Editor" />
          <TabBtn active={activeTab==='generator'} onClick={()=>setActiveTab('generator')} icon="✨" label="IA" />
          <TabBtn active={activeTab==='critique'} onClick={()=>setActiveTab('critique')} icon="🗿" label="Mestre" />
        </nav>
      </header>

      {/* Área Principal */}
      <main className="flex-1 relative overflow-hidden">
        <div className={`absolute inset-0 transition-all duration-500 ease-out ${activeTab === 'editor' ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-95 z-0 pointer-events-none'}`}>
          <PixelEditor 
            onExport={handleExport} 
            onCritiqueRequest={(img) => { setPendingCritique(img); setActiveTab('critique'); }} 
            activeReference={activeReference}
          />
        </div>

        <div className={`absolute inset-0 bg-[#09090b] transition-all duration-500 ease-out ${activeTab === 'generator' ? 'translate-y-0 opacity-100 z-10' : 'translate-y-24 opacity-0 z-0 pointer-events-none'}`}>
           <div className="h-full overflow-y-auto custom-scroll p-6 md:p-12">
              <AIGenerator onUseAsRef={handleUseRef} />
           </div>
        </div>

        <div className={`absolute inset-0 bg-[#09090b] transition-all duration-500 ease-out ${activeTab === 'critique' ? 'translate-y-0 opacity-100 z-10' : 'translate-y-24 opacity-0 z-0 pointer-events-none'}`}>
           <div className="h-full overflow-y-auto custom-scroll p-6 md:p-12">
              <AICritique externalImage={pendingCritique} onImageProcessed={() => setPendingCritique(null)} />
           </div>
        </div>
      </main>
    </div>
  );
};

const TabBtn = ({ active, onClick, icon, label }: any) => (
  <button 
    onClick={onClick} 
    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all duration-300 ${active ? 'bg-zinc-800 text-white border border-zinc-700 shadow-xl' : 'text-zinc-500 hover:text-zinc-300'}`}
  >
    <span className="text-base">{icon}</span>
    <span className="hidden sm:inline text-[9px] font-bold uppercase tracking-widest">{label}</span>
  </button>
);

export default App;

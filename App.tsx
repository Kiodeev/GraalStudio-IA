
import React, { useState } from 'react';
import PixelEditor from './components/PixelEditor';
import AIGenerator from './components/AIGenerator';
import AICritique from './components/AICritique';
import { TabType } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('editor');
  const [activeReference, setActiveReference] = useState<string | null>(null);
  const [pendingCritique, setPendingCritique] = useState<string | null>(null);

  const handleExport = (dataUrl: string) => {
    const link = document.createElement('a');
    link.download = `graal-studio-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  };

  const handleUseRef = (url: string) => {
    setActiveReference(url);
    setActiveTab('editor');
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#09090b] text-zinc-100 overflow-hidden">
      {/* Header Minimalista Cinza */}
      <header className="h-16 bg-[#09090b] border-b border-zinc-800/50 flex items-center justify-between px-6 z-50 shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-zinc-100 rounded-lg flex items-center justify-center font-black text-black text-xs shadow-md">S</div>
          <div>
            <h1 className="text-[10px] font-black tracking-[0.3em] uppercase text-zinc-100">Studio <span className="text-indigo-500">Pro</span></h1>
          </div>
        </div>
        
        <nav className="flex bg-zinc-900/40 p-1 rounded-xl border border-zinc-800/60">
          <TabBtn active={activeTab==='editor'} onClick={()=>setActiveTab('editor')} icon="🖌️" label="Editor" />
          <TabBtn active={activeTab==='generator'} onClick={()=>setActiveTab('generator')} icon="✨" label="IA Refs" />
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

        <div className={`absolute inset-0 bg-[#09090b] transition-all duration-500 ease-out ${activeTab === 'generator' ? 'translate-y-0 opacity-100 z-10' : 'translate-y-20 opacity-0 z-0 pointer-events-none'}`}>
           <div className="h-full overflow-y-auto custom-scroll p-6 md:p-12">
              <AIGenerator onUseAsRef={handleUseRef} />
           </div>
        </div>

        <div className={`absolute inset-0 bg-[#09090b] transition-all duration-500 ease-out ${activeTab === 'critique' ? 'translate-y-0 opacity-100 z-10' : 'translate-y-20 opacity-0 z-0 pointer-events-none'}`}>
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
    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${active ? 'bg-zinc-800 text-white border border-zinc-700 shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
  >
    <span className="text-sm">{icon}</span>
    <span className="hidden sm:inline text-[9px] font-bold uppercase tracking-widest">{label}</span>
  </button>
);

export default App;


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
    link.download = `graal-asset-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  };

  const handleUseRef = (url: string) => {
    setActiveReference(url);
    setActiveTab('editor');
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#0d1a0d] text-zinc-100 overflow-hidden pt-safe">
      {/* Header Estilo Graal */}
      <header className="h-14 md:h-16 bg-[#1a2e1a] border-b-2 border-[#3e6b3e] flex items-center justify-between px-4 md:px-8 z-50 shrink-0 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-green-600 rounded-lg flex items-center justify-center font-black text-white italic text-xs md:text-sm shadow-md border border-green-400">G</div>
          <div className="hidden sm:block">
            <h1 className="text-xs font-black tracking-widest uppercase text-green-400">GRAAL CRAFT <span className="text-white">IA</span></h1>
            <p className="text-[8px] text-green-800 font-bold uppercase tracking-tighter">Artist Studio v4.0</p>
          </div>
        </div>
        
        <nav className="flex bg-[#0d1a0d] p-1 rounded-xl border border-[#3e6b3e] shadow-inner">
          <TabBtn active={activeTab==='editor'} onClick={()=>setActiveTab('editor')} icon="🖌️" label="Editor" />
          <TabBtn active={activeTab==='generator'} onClick={()=>setActiveTab('generator')} icon="✨" label="IA Refs" />
          <TabBtn active={activeTab==='critique'} onClick={()=>setActiveTab('critique')} icon="🗿" label="Mestre" />
        </nav>
      </header>

      {/* Área Principal */}
      <main className="flex-1 relative overflow-hidden">
        <div className={`absolute inset-0 transition-opacity duration-300 ${activeTab === 'editor' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
          <PixelEditor 
            onExport={handleExport} 
            onCritiqueRequest={(img) => { setPendingCritique(img); setActiveTab('critique'); }} 
            activeReference={activeReference}
          />
        </div>

        <div className={`absolute inset-0 bg-[#0d1a0d] transition-all duration-300 ${activeTab === 'generator' ? 'translate-y-0 opacity-100 z-10' : 'translate-y-8 opacity-0 z-0 pointer-events-none'}`}>
           <div className="scroll-container custom-scroll p-4 md:p-8">
              <AIGenerator onUseAsRef={handleUseRef} />
           </div>
        </div>

        <div className={`absolute inset-0 bg-[#0d1a0d] transition-all duration-300 ${activeTab === 'critique' ? 'translate-y-0 opacity-100 z-10' : 'translate-y-8 opacity-0 z-0 pointer-events-none'}`}>
           <div className="scroll-container custom-scroll p-4 md:p-8">
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
    className={`flex items-center gap-2 px-3 md:px-5 py-2 rounded-lg transition-all duration-200 ${active ? 'bg-green-800 text-white border border-green-600' : 'text-green-900 hover:text-green-400'}`}
  >
    <span className="text-base md:text-lg">{icon}</span>
    <span className="hidden md:inline text-[10px] font-black uppercase tracking-widest">{label}</span>
  </button>
);

export default App;

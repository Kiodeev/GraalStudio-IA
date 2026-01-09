
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
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Studio Header */}
      <header className="h-16 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-6 z-50">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center font-black text-white italic">G</div>
          <h1 className="text-sm font-black tracking-tighter uppercase hidden sm:block">
            Graal Studio <span className="text-indigo-500 italic">Pro</span>
          </h1>
        </div>

        <nav className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800">
           <TabBtn active={activeTab==='editor'} onClick={()=>setActiveTab('editor')} label="Canvas" icon="🖌️" />
           <TabBtn active={activeTab==='generator'} onClick={()=>setActiveTab('generator')} label="Ref. IA" icon="✨" />
           <TabBtn active={activeTab==='critique'} onClick={()=>setActiveTab('critique')} label="Mestre IA" icon="🗿" />
        </nav>

        <div className="flex items-center gap-4">
           <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest hidden md:block">Status: <span className="text-green-500">Live Studio</span></div>
        </div>
      </header>

      {/* Dynamic Content Container */}
      <main className="flex-1 relative">
        <div className={`absolute inset-0 transition-opacity duration-300 ${activeTab === 'editor' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
          <PixelEditor 
            onExport={handleExport} 
            onCritiqueRequest={(img) => { setPendingCritique(img); setActiveTab('critique'); }} 
            activeReference={activeReference}
          />
        </div>

        <div className={`absolute inset-0 bg-zinc-950 overflow-y-auto p-4 sm:p-10 transition-transform duration-300 ${activeTab === 'generator' ? 'translate-x-0' : 'translate-x-full'}`}>
           <AIGenerator onUseAsRef={handleUseRef} />
        </div>

        <div className={`absolute inset-0 bg-zinc-950 overflow-y-auto p-4 sm:p-10 transition-transform duration-300 ${activeTab === 'critique' ? 'translate-x-0' : '-translate-x-full'}`}>
           <AICritique externalImage={pendingCritique} onImageProcessed={() => setPendingCritique(null)} />
        </div>
      </main>
    </div>
  );
};

const TabBtn = ({ active, onClick, label, icon }: any) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${active ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
  >
    <span>{icon}</span>
    <span className="hidden sm:inline">{label}</span>
  </button>
);

export default App;

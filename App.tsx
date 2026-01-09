
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";

// Wickler AI Config
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

// Professional Pixel Assets
const SKETCHES = {
  head: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAMElEQVR42mNkYGD4z0AAMDAyMIy6YDQERkNgeAAZGRkZGRkZGRkZGRkZGRkZGUMDAADMawm766/K+wAAAABJRU5ErkJggg==",
  body: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAABACAYAAABm6XpYAAAAM0lEQVR42u3BAQ0AAADCoPdPbQ43oAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIDvAbKWAfG0366VAAAAAElFTkSuQmCC"
};

const PRO_PALETTE = [
  '#000000', '#ffffff', '#2c2c2e', '#ff3b30', '#ffcc00', '#4cd964', '#007aff', '#5856d6',
  '#f3a35f', '#8e5d3c', '#4b321c', '#ef7d57', '#ffcd75', '#a7f070', '#b13e53', '#1a1c2c'
];

// --- Traduções ---
const I18N = {
  pt: {
    studio: "Estúdio", forge: "Forja", oracle: "Crítico", 
    build: "Ferramentas", tone: "Cores", mold: "Bases", review: "Analisar Arte",
    pencil: "Lápis", eraser: "Borracha", picker: "Conta-gotas", size: "Tamanho",
    clear: "Limpar", actualSize: "Real", analysisLoading: "Processando Relatório Neural...",
    oracleWait: "Inicie o escaneamento artístico...", symmetry: "Simetria", hex: "Cód. Hex",
    opacity: "Opacidade", inject: "Injetar no Estúdio", forgeTitle: "FORJA CRIATIVA",
    oracleTitle: "RELATÓRIO DO CRÍTICO", forgeDesc: "Gere referências de alta qualidade para seus projetos.",
    oracleDesc: "Análise técnica avançada de composição e técnica.",
    aiPrompt: "Você é o Crítico de Arte Wickler, um especialista global em design e ilustração. Analise esta imagem sob uma ótica profissional. Avalie: 1. Composição e Peso Visual, 2. Teoria das Cores e Harmonia, 3. Técnica, Detalhamento e Iluminação. Não foque em jogos, avalie como uma obra de arte universal. Seja técnico, profundo e construtivo. Responda em Português."
  },
  en: {
    studio: "Studio", forge: "Forge", oracle: "Critic", 
    build: "Tools", tone: "Colors", mold: "Assets", review: "Analyze Art",
    pencil: "Pencil", eraser: "Eraser", picker: "Picker", size: "Size",
    clear: "Clear", actualSize: "Real", analysisLoading: "Processing Neural Report...",
    oracleWait: "Initialize artistic scan...", symmetry: "Symmetry", hex: "Hex Code",
    opacity: "Opacity", inject: "Inject into Studio", forgeTitle: "CREATIVE FORGE",
    oracleTitle: "CRITIC REPORT", forgeDesc: "Generate high-end references for your projects.",
    oracleDesc: "Advanced technical analysis of composition and technique.",
    aiPrompt: "You are the Wickler Art Critic, a global expert in design and illustration. Analyze this image from a professional perspective. Evaluate: 1. Composition and Visual Weight, 2. Color Theory and Harmony, 3. Technique, Detail, and Lighting. Do not focus on games; evaluate it as a universal piece of art. Be technical, profound, and constructive. Respond in English."
  }
};

const playHaptic = (type: 'light' | 'medium' | 'success') => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    if (type === 'light') { osc.frequency.value = 800; gain.gain.value = 0.005; }
    else if (type === 'medium') { osc.frequency.value = 400; gain.gain.value = 0.01; }
    else { osc.frequency.value = 600; gain.gain.value = 0.02; }
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.05);
  } catch (e) {}
};

// --- EDITOR COMPONENT ---
const WicklerEditor = ({ onAnalyze, activeRef, lang }: any) => {
  const t = I18N[lang as keyof typeof I18N];
  const [grid, setGrid] = useState({ w: 32, h: 32 });
  const [tool, setTool] = useState('pencil');
  const [color, setColor] = useState('#ffffff');
  const [brushSize, setBrushSize] = useState(1);
  const [symmetry, setSymmetry] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [panel, setPanel] = useState<'tools'|'palette'|'assets'|null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [sketch, setSketch] = useState<string | null>(null);
  const [sketchOpacity, setSketchOpacity] = useState(0.2);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const lastPos = useRef<{x: number, y: number} | null>(null);

  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    ctxRef.current = ctx;
    ctx.imageSmoothingEnabled = false;
    if (history.length === 0) {
      ctx.clearRect(0, 0, grid.w, grid.h);
      setHistory([cvs.toDataURL()]);
    }
    updatePreview();
  }, [grid]);

  const updatePreview = () => {
    if (!canvasRef.current || !previewRef.current) return;
    const pCtx = previewRef.current.getContext('2d');
    if (!pCtx) return;
    pCtx.imageSmoothingEnabled = false;
    pCtx.clearRect(0, 0, grid.w, grid.h);
    pCtx.drawImage(canvasRef.current, 0, 0);
  };

  const getPos = (e: any) => {
    const r = canvasRef.current!.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: Math.floor((cx - r.left) * (grid.w / r.width)),
      y: Math.floor((cy - r.top) * (grid.h / r.height))
    };
  };

  const drawPixel = (x: number, y: number) => {
    if (!ctxRef.current) return;
    const offset = Math.floor(brushSize / 2);
    const applyDraw = (px: number, py: number) => {
      if (tool === 'pencil') {
        ctxRef.current!.fillStyle = color;
        ctxRef.current!.fillRect(px - offset, py - offset, brushSize, brushSize);
      } else if (tool === 'eraser') {
        ctxRef.current!.clearRect(px - offset, py - offset, brushSize, brushSize);
      }
    };
    applyDraw(x, y);
    if (symmetry) applyDraw(grid.w - 1 - x, y);
  };

  const onStart = (e: any) => {
    const p = getPos(e); lastPos.current = p;
    if (tool === 'picker') {
      const d = ctxRef.current!.getImageData(p.x, p.y, 1, 1).data;
      if (d[3] > 0) setColor("#" + ((1<<24)+(d[0]<<16)+(d[1]<<8)+d[2]).toString(16).slice(1));
      setTool('pencil'); playHaptic('success');
      return;
    }
    drawPixel(p.x, p.y); playHaptic('light');
    updatePreview();
  };

  const onMove = (e: any) => {
    if (e.buttons !== 1 && !e.touches) return;
    const p = getPos(e);
    if (!lastPos.current) return;
    let x0 = lastPos.current.x, y0 = lastPos.current.y;
    const x1 = p.x, y1 = p.y;
    const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;
    while(true) {
      drawPixel(x0, y0);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x0 += sx; }
      if (e2 < dx) { err += dx; y0 += sy; }
    }
    lastPos.current = p;
    updatePreview();
  };

  return (
    <div className="flex flex-col h-full relative animate-glass overflow-hidden">
      <div className="flex-1 checkerboard flex items-center justify-center relative touch-none overflow-hidden p-4">
        <div style={{ transform: `scale(${zoom + (window.innerWidth < 768 ? 0.4 : 2)})` }} className="relative transition-transform duration-300">
           {activeRef && <img src={activeRef} className="absolute inset-0 w-full h-full opacity-30 pixel-render pointer-events-none z-0" />}
           {sketch && <img src={sketch} style={{ opacity: sketchOpacity }} className="absolute inset-0 w-full h-full pixel-render pointer-events-none z-0 invert" />}
           <canvas ref={canvasRef} width={grid.w} height={grid.h} onMouseDown={onStart} onMouseMove={onMove} onMouseUp={() => setHistory(p => [...p, canvasRef.current!.toDataURL()].slice(-30))} onTouchStart={onStart} onTouchMove={onMove} onTouchEnd={() => setHistory(p => [...p, canvasRef.current!.toDataURL()].slice(-30))} className="bg-transparent border border-zinc-800 shadow-2xl pixel-render relative z-10" style={{ width: grid.w * 8, height: grid.h * 8 }} />
           {symmetry && <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-indigo-500/50 z-20 pointer-events-none" />}
        </div>

        {/* Floating Side Tools */}
        <div className="absolute right-4 top-4 flex flex-col gap-3 z-30">
           <div className="drawer-blur p-1 rounded-2xl border border-zinc-800/50 flex flex-col gap-1 shadow-2xl">
             <button onClick={() => setZoom(z => Math.min(z+0.5, 6))} className="w-10 h-10 flex items-center justify-center text-xl hover:bg-white/10 rounded-xl transition-all">🔍</button>
             <button onClick={() => setZoom(z => Math.max(z-0.5, 0.5))} className="w-10 h-10 flex items-center justify-center text-xl hover:bg-white/10 rounded-xl transition-all">➖</button>
           </div>
           <button onClick={() => setSymmetry(!symmetry)} className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all shadow-2xl ${symmetry ? 'bg-indigo-600 border-indigo-400' : 'drawer-blur border-zinc-800/50 text-white'}`}>⚖️</button>
        </div>

        {/* Mini Preview */}
        <div className="absolute left-4 top-4 drawer-blur p-2 rounded-2xl border border-zinc-800/50 shadow-2xl z-30 hidden sm:block">
           <canvas ref={previewRef} width={grid.w} height={grid.h} className="w-12 h-12 pixel-render bg-zinc-950 rounded border border-zinc-800" />
           <div className="text-[7px] font-black uppercase text-center mt-1.5 text-zinc-500">{t.actualSize}</div>
        </div>
      </div>

      {/* Main Bottom Toolbar */}
      <div className="bg-black/95 border-t border-zinc-800/50 px-4 py-3 sm:px-8 sm:py-5 flex items-center justify-between safe-pb z-50">
         <div className="flex gap-2 shrink-0">
            <button onClick={() => setPanel(panel === 'tools' ? null : 'tools')} className={`px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${panel==='tools' ? 'bg-indigo-600 border-indigo-400 shadow-lg shadow-indigo-500/20' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}>{t.build}</button>
            <button onClick={() => setPanel(panel === 'palette' ? null : 'palette')} className={`px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${panel==='palette' ? 'bg-indigo-600 border-indigo-400 shadow-lg shadow-indigo-500/20' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}>{t.tone}</button>
            <button onClick={() => setPanel(panel === 'assets' ? null : 'assets')} className={`px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${panel==='assets' ? 'bg-indigo-600 border-indigo-400 shadow-lg shadow-indigo-500/20' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}>{t.mold}</button>
         </div>
         <button onClick={() => onAnalyze(canvasRef.current!.toDataURL())} className="bg-white text-black px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">{t.review} 🗿</button>
      </div>

      {/* Pro Drawer */}
      {panel && (
        <div className="absolute inset-x-0 bottom-[110px] drawer-blur border-t border-zinc-800/50 p-6 sm:p-8 animate-slide-up z-[60] rounded-t-[40px] shadow-[0_-20px_60px_rgba(0,0,0,0.8)]">
          <div className="w-16 h-1.5 bg-zinc-700/50 rounded-full mx-auto mb-8" />
          
          {panel === 'tools' && (
            <div className="space-y-6">
              <div className="flex flex-wrap gap-3">
                <ToolItem active={tool==='pencil'} icon="✏️" label={t.pencil} onClick={() => {setTool('pencil'); setPanel(null);}} />
                <ToolItem active={tool==='eraser'} icon="🧹" label={t.eraser} onClick={() => {setTool('eraser'); setPanel(null);}} />
                <ToolItem active={tool==='picker'} icon="💉" label={t.picker} onClick={() => {setTool('picker'); setPanel(null);}} />
              </div>
              <div className="bg-black/40 p-4 rounded-3xl border border-zinc-800/50 flex flex-col gap-4">
                 <div className="flex justify-between text-[10px] font-black uppercase text-zinc-500 tracking-widest px-2"><span>{t.size}</span><span>{brushSize}px</span></div>
                 <div className="flex gap-2">
                    {[1, 2, 4, 8].map(s => <button key={s} onClick={() => setBrushSize(s)} className={`flex-1 py-4 rounded-xl font-black text-xs transition-all ${brushSize===s ? 'bg-indigo-600 shadow-lg' : 'bg-zinc-800 text-zinc-500'}`}>{s}</button>)}
                 </div>
              </div>
            </div>
          )}

          {panel === 'palette' && (
            <div className="space-y-6">
              <div className="grid grid-cols-8 gap-2.5">
                {PRO_PALETTE.map(c => <button key={c} onClick={() => {setColor(c); setPanel(null); playHaptic('medium');}} className="aspect-square rounded-xl border-2 border-white/5 active:scale-90 transition-all shadow-md" style={{backgroundColor: c}} />)}
              </div>
              <div className="flex items-center gap-4 bg-black/50 p-4 rounded-[2rem] border border-zinc-800/50">
                <div className="w-12 h-12 rounded-2xl relative overflow-hidden ring-2 ring-white/10">
                   <input type="color" value={color} onChange={e => setColor(e.target.value)} className="absolute inset-0 scale-[4] cursor-pointer" />
                </div>
                <div className="flex-1">
                   <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{t.hex}</p>
                   <p className="font-mono text-lg font-bold text-indigo-400">{color.toUpperCase()}</p>
                </div>
              </div>
            </div>
          )}

          {panel === 'assets' && (
            <div className="space-y-5">
              <div className="flex gap-3">
                <button onClick={() => {setGrid({w:32, h:32}); setSketch(SKETCHES.head); setPanel(null);}} className="flex-1 p-5 bg-zinc-900 rounded-[2rem] text-[9px] font-black uppercase tracking-wider border border-zinc-800 hover:border-indigo-500/50 transition-all">Head Base</button>
                <button onClick={() => {setGrid({w:32, h:64}); setSketch(SKETCHES.body); setPanel(null);}} className="flex-1 p-5 bg-zinc-900 rounded-[2rem] text-[9px] font-black uppercase tracking-wider border border-zinc-800 hover:border-indigo-500/50 transition-all">Body Base</button>
              </div>
              <div className="bg-black/40 p-5 rounded-[2rem] border border-zinc-800/50 space-y-4">
                <div className="flex justify-between text-[9px] font-black uppercase text-zinc-500 tracking-widest px-2"><span>{t.opacity}</span><span>{Math.round(sketchOpacity*100)}%</span></div>
                <input type="range" min="0" max="1" step="0.1" value={sketchOpacity} onChange={e => setSketchOpacity(parseFloat(e.target.value))} className="w-full h-1 bg-zinc-800 rounded-full appearance-none accent-indigo-500" />
                <button onClick={() => {setSketch(null); setPanel(null);}} className="w-full text-[9px] font-black text-red-500 uppercase tracking-widest py-2 hover:text-red-400 transition-all">Clear Bases</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ToolItem = ({ active, icon, label, onClick }: any) => (
  <button onClick={onClick} className={`flex flex-1 flex-col items-center gap-2 p-4 rounded-[2rem] border-2 transition-all ${active ? 'bg-white text-black border-white shadow-xl scale-105' : 'bg-black/50 text-zinc-600 border-zinc-800/50 hover:border-zinc-700'}`}>
    <span className="text-2xl">{icon}</span>
    <span className="text-[8px] font-black uppercase tracking-widest">{label}</span>
  </button>
);

// --- PROFESSIONAL FORGE (AIGenerator) ---
const WicklerGen = ({ onUse, lang }: any) => {
  const t = I18N[lang as keyof typeof I18N];
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const generate = async () => {
    if (!prompt) return;
    setLoading(true);
    try {
      const ai = getAI();
      const resp = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: `Professional digital art reference asset: ${prompt}. Cinematic lighting, detailed textures, clean composition, solid neutral background.` }] }
      });
      const data = resp.candidates?.[0]?.content?.parts.find(p => p.inlineData)?.inlineData?.data;
      if (data) { setResult(`data:image/png;base64,${data}`); playHaptic('success'); }
    } catch(e) {}
    setLoading(false);
  };

  return (
    <div className="h-full bg-[#050505] overflow-y-auto no-scrollbar pb-32 animate-glass">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <header className="mb-14 text-center">
          <div className="inline-block px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[9px] font-black uppercase tracking-[0.3em] mb-4">Laboratory v9.1</div>
          <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-white leading-tight">{t.forgeTitle}</h2>
          <p className="text-zinc-500 text-sm md:text-base font-medium mt-3">{t.forgeDesc}</p>
        </header>

        <div className="flex flex-col md:flex-row gap-4 p-3 bg-zinc-900/30 rounded-[2.5rem] border border-zinc-800/50 mb-16 shadow-2xl focus-within:border-indigo-500/30 transition-all">
          <input 
            value={prompt} 
            onChange={e => setPrompt(e.target.value)} 
            placeholder="Ex: Cyberpunk Helmet Design, Victorian Sword..." 
            className="flex-1 bg-transparent px-6 py-4 focus:outline-none font-bold text-lg text-white placeholder:text-zinc-700" 
          />
          <button 
            onClick={generate} 
            disabled={loading || !prompt} 
            className="bg-indigo-600 text-white px-10 py-5 rounded-[1.8rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/20 active:scale-95 transition-all disabled:opacity-20"
          >
            {loading ? 'Synthesizing...' : 'Initialize Forge'}
          </button>
        </div>

        {result ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 bg-zinc-900/20 p-8 rounded-[4rem] border border-zinc-800/40 relative overflow-hidden group">
              <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <img src={result} className="w-full aspect-square object-contain rounded-[2.5rem] shadow-[0_40px_80px_rgba(0,0,0,0.8)] border border-white/5 relative z-10 transition-transform duration-700 group-hover:scale-105" />
            </div>
            <div className="lg:col-span-5 space-y-8">
               <div className="bg-zinc-900/40 p-8 rounded-[3rem] border border-zinc-800/40">
                  <h4 className="text-zinc-400 text-[10px] font-black uppercase tracking-[0.3em] mb-4">Integration Options</h4>
                  <button onClick={() => onUse(result)} className="w-full py-6 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-xl hover:bg-zinc-200">{t.inject}</button>
               </div>
               <div className="px-4 text-zinc-600 text-[10px] font-medium leading-relaxed italic">
                 Note: Assets are generated as high-fidelity references for tracing or style inspiration within the studio.
               </div>
            </div>
          </div>
        ) : (
          <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-zinc-900 rounded-[4rem]">
             <div className="w-20 h-20 bg-zinc-900/50 rounded-full flex items-center justify-center text-4xl grayscale opacity-20 mb-6">⚡</div>
             <p className="text-[10px] font-black text-zinc-800 uppercase tracking-[0.4em]">Engine Standby</p>
          </div>
        )}
      </div>
    </div>
  );
};

// --- PROFESSIONAL ORACLE (AICritique) ---
const WicklerOracle = ({ image, lang }: any) => {
  const t = I18N[lang as keyof typeof I18N];
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (image) analyze(); }, [image]);

  const analyze = async () => {
    setFeedback('');
    setLoading(true);
    try {
      const ai = getAI();
      const base64Data = image.split(',')[1];
      const resp = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [
          { inlineData: { mimeType: 'image/png', data: base64Data } },
          { text: t.aiPrompt }
        ]}
      });
      setFeedback(resp.text || 'Review unavailable.'); playHaptic('success');
    } catch(e) { setFeedback("Neural link interrupted. Please verify connection."); }
    setLoading(false);
  };

  return (
    <div className="h-full bg-[#050505] overflow-y-auto no-scrollbar pb-32 animate-glass">
       <div className="max-w-5xl mx-auto px-6 py-12">
          <header className="mb-14 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-block px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[9px] font-black uppercase tracking-[0.3em] mb-4">Neural Scanner v4.0</div>
              <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-white leading-tight">{t.oracleTitle}</h2>
              <p className="text-zinc-500 text-sm md:text-base font-medium mt-2">{t.oracleDesc}</p>
            </div>
            {image && (
              <button onClick={analyze} disabled={loading} className="px-8 py-4 bg-zinc-900 border border-zinc-800 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-all active:scale-95 disabled:opacity-30 shrink-0">
                Rescan Masterpiece 🔄
              </button>
            )}
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-5">
              <div className="p-12 bg-zinc-900/30 border border-zinc-800/60 rounded-[4rem] flex justify-center shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-50" />
                {image ? (
                  <img src={image} className="w-full aspect-square object-contain pixel-render scale-110 shadow-2xl rounded-2xl relative z-10 transition-all duration-1000 group-hover:scale-125" />
                ) : (
                  <div className="py-20 flex flex-col items-center justify-center opacity-20">
                    <span className="text-7xl mb-6">👁️</span>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em]">Awaiting Visual Input</p>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-7">
               <div className="bg-zinc-900/40 p-10 md:p-14 border border-zinc-800/60 rounded-[4rem] relative min-h-[400px] shadow-[inset_0_20px_40px_rgba(0,0,0,0.4)]">
                  <div className="flex items-center gap-4 mb-10">
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-xl ring-4 ring-black">🗿</div>
                    <div>
                       <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">Expert Analysis</p>
                       <p className="text-xs font-bold text-white uppercase tracking-wider">The Wickler Master</p>
                    </div>
                  </div>

                  {loading ? (
                    <div className="py-20 flex flex-col items-center gap-8">
                       <div className="w-10 h-10 border-4 border-zinc-800 border-t-indigo-500 rounded-full animate-spin" />
                       <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest animate-pulse">{t.analysisLoading}</p>
                    </div>
                  ) : (
                    <div className="text-zinc-200 italic font-medium leading-relaxed text-base md:text-xl whitespace-pre-wrap animate-in fade-in slide-in-from-bottom-4 duration-700">
                       {feedback || t.oracleWait}
                    </div>
                  )}

                  {feedback && !loading && (
                    <div className="mt-14 pt-8 border-t border-zinc-800/40 flex justify-between items-center">
                       <span className="text-[8px] font-black text-indigo-500 uppercase tracking-[0.4em]">Verified Studio Pro Report</span>
                       <span className="text-zinc-700 text-[10px]">W.S.09-2025</span>
                    </div>
                  )}
               </div>
            </div>
          </div>
       </div>
    </div>
  );
};

// --- MAIN APP ---
export default function App() {
  const [tab, setTab] = useState('editor');
  const [lang, setLang] = useState<'pt'|'en'>('pt');
  const [activeRef, setActiveRef] = useState<string | null>(null);
  const [critiqueImg, setCritiqueImg] = useState<string | null>(null);

  const t = I18N[lang];

  return (
    <div className="flex flex-col h-screen w-full bg-[#050505] text-white selection:bg-indigo-500/30 overflow-hidden font-sans">
      {/* Dynamic Header */}
      <header className="h-20 border-b border-zinc-900/50 flex items-center justify-between px-6 sm:px-10 shrink-0 bg-black/80 backdrop-blur-3xl z-[100]">
        <div className="flex items-center gap-4">
           <div className="w-11 h-11 bg-indigo-600 rounded-2xl flex items-center justify-center font-black text-white text-xl shadow-[0_0_30px_rgba(99,102,241,0.4)] transition-transform hover:scale-110 active:scale-95">W</div>
           <div className="hidden sm:block">
              <span className="text-xs font-black uppercase tracking-[0.4em] text-white block leading-none">Wickler Studio</span>
              <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest mt-2 block">Universal Pro Station v10</span>
           </div>
        </div>
        
        <div className="flex gap-4 sm:gap-8 items-center">
           {/* Idioma Toggle com Bandeiras (Corrigido) */}
           <button 
             onClick={() => {setLang(lang === 'pt' ? 'en' : 'pt'); playHaptic('light');}} 
             className="text-2xl bg-zinc-900 hover:bg-zinc-800 px-4 py-1.5 rounded-2xl border border-zinc-800/50 transition-all active:scale-90 shadow-xl"
             title={lang === 'pt' ? "Switch to English" : "Mudar para Português"}
           >
             {lang === 'pt' ? '🇧🇷' : '🇺🇸'}
           </button>
           
           <nav className="hidden md:flex gap-12">
             {['editor', 'lab', 'oracle'].map(id => (
               <button 
                key={id} 
                onClick={() => {setTab(id); playHaptic('light');}} 
                className={`text-[10px] font-black uppercase tracking-[0.5em] transition-all relative py-2 ${tab===id ? 'text-white' : 'text-zinc-600 hover:text-zinc-400'}`}
               >
                 {id === 'editor' ? t.studio : id === 'lab' ? t.forge : t.oracle}
                 {tab === id && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500 rounded-full animate-in zoom-in" />}
               </button>
             ))}
           </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 relative overflow-hidden bg-[#050505]">
        {tab === 'editor' && <WicklerEditor onAnalyze={(img: any) => {setCritiqueImg(img); setTab('oracle'); playHaptic('success');}} activeRef={activeRef} lang={lang} />}
        {tab === 'lab' && <WicklerGen onUse={(img: any) => {setActiveRef(img); setTab('editor'); playHaptic('success');}} lang={lang} />}
        {tab === 'oracle' && <WicklerOracle image={critiqueImg} lang={lang} />}
      </main>

      {/* Mobile Nav */}
      <nav className="md:hidden flex justify-around items-center bg-black/95 border-t border-zinc-900/40 h-24 safe-pb z-[100] backdrop-blur-2xl">
         <button onClick={() => {setTab('editor'); playHaptic('light');}} className={`flex flex-col items-center gap-2 transition-all ${tab==='editor' ? 'scale-110' : 'opacity-20 grayscale'}`}>
            <span className="text-3xl">🖌️</span>
            <span className={`text-[9px] font-black uppercase tracking-widest ${tab==='editor' ? 'text-indigo-400' : 'text-zinc-600'}`}>{t.studio}</span>
         </button>
         <button onClick={() => {setTab('lab'); playHaptic('light');}} className={`flex flex-col items-center gap-2 transition-all ${tab==='lab' ? 'scale-110' : 'opacity-20 grayscale'}`}>
            <span className="text-3xl">✨</span>
            <span className={`text-[9px] font-black uppercase tracking-widest ${tab==='lab' ? 'text-indigo-400' : 'text-zinc-600'}`}>{t.forge}</span>
         </button>
         <button onClick={() => {setTab('oracle'); playHaptic('light');}} className={`flex flex-col items-center gap-2 transition-all ${tab==='oracle' ? 'scale-110' : 'opacity-20 grayscale'}`}>
            <span className="text-3xl">🗿</span>
            <span className={`text-[9px] font-black uppercase tracking-widest ${tab==='oracle' ? 'text-indigo-400' : 'text-zinc-600'}`}>{t.oracle}</span>
         </button>
      </nav>

      <style>{`
        .animate-glass { animation: glass-in 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-slide-up { animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes glass-in { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .drawer-blur { backdrop-filter: blur(40px) saturate(200%); background: rgba(8, 8, 10, 0.9); }
        .checkerboard {
            background-image: linear-gradient(45deg, #0a0a0a 25%, transparent 25%), 
                              linear-gradient(-45deg, #0a0a0a 25%, transparent 25%), 
                              linear-gradient(45deg, transparent 75%, #0a0a0a 75%), 
                              linear-gradient(-45deg, transparent 75%, #0a0a0a 75%);
            background-size: 16px 16px; background-color: #050505;
        }
        .custom-scroll::-webkit-scrollbar { width: 4px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #27272a; border-radius: 10px; }
        input[type="range"] { -webkit-appearance: none; background: transparent; }
        input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; height: 16px; width: 16px; border-radius: 50%; background: #6366f1; cursor: pointer; margin-top: -6px; box-shadow: 0 0 10px rgba(99,102,241,0.5); }
        input[type="range"]::-webkit-slider-runnable-track { width: 100%; height: 4px; cursor: pointer; background: #27272a; border-radius: 2px; }
      `}</style>
    </div>
  );
}

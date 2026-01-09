
import React, { useState, useRef, useEffect } from 'react';

interface PixelEditorProps {
  onExport: (dataUrl: string) => void;
  onCritiqueRequest: (dataUrl: string) => void;
  activeReference?: string | null;
}

const PixelEditor: React.FC<PixelEditorProps> = ({ onExport, onCritiqueRequest, activeReference }) => {
  const [gridSize, setGridSize] = useState({ w: 32, h: 32 });
  const [color, setColor] = useState('#ffffff');
  const [tool, setTool] = useState<'pencil' | 'eraser' | 'picker' | 'fill' | 'line'>('pencil');
  const [isDrawing, setIsDrawing] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [hIndex, setHIndex] = useState(-1);
  const [refOpacity, setRefOpacity] = useState(0.4);
  const [showProps, setShowProps] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const startPos = useRef<{x: number, y: number} | null>(null);

  useEffect(() => {
    initCanvas();
  }, [gridSize]);

  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    saveState();
  };

  const saveState = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx) {
      const data = ctx.getImageData(0, 0, gridSize.w, gridSize.h);
      const newHistory = history.slice(0, hIndex + 1);
      newHistory.push(data);
      if (newHistory.length > 50) newHistory.shift();
      setHistory(newHistory);
      setHIndex(newHistory.length - 1);
      updatePreview();
    }
  };

  const updatePreview = () => {
    if (canvasRef.current && previewRef.current) {
      const pCtx = previewRef.current.getContext('2d');
      if (pCtx) {
        pCtx.imageSmoothingEnabled = false;
        pCtx.clearRect(0, 0, gridSize.w, gridSize.h);
        pCtx.drawImage(canvasRef.current, 0, 0);
      }
    }
  };

  const getPos = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const x = Math.floor(((clientX - rect.left) / rect.width) * gridSize.w);
    const y = Math.floor(((clientY - rect.top) / rect.height) * gridSize.h);
    return { x, y };
  };

  const handleStart = (e: any) => {
    if (e.cancelable) e.preventDefault();
    const pos = getPos(e);
    if (!pos) return;
    setIsDrawing(true);
    startPos.current = pos;
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx && tool !== 'line' && tool !== 'fill' && tool !== 'picker') {
      drawPixel(ctx, pos.x, pos.y, color);
    }
  };

  const handleMove = (e: any) => {
    if (e.cancelable) e.preventDefault();
    if (!isDrawing) return;
    const pos = getPos(e);
    if (!pos) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx && (tool === 'pencil' || tool === 'eraser')) {
      drawPixel(ctx, pos.x, pos.y, color);
    }
  };

  const drawPixel = (ctx: CanvasRenderingContext2D, x: number, y: number, c: string) => {
    if (x < 0 || x >= gridSize.w || y < 0 || y >= gridSize.h) return;
    if (tool === 'eraser') {
      ctx.clearRect(x, y, 1, 1);
    } else {
      ctx.fillStyle = c;
      ctx.fillRect(x, y, 1, 1);
    }
  };

  const handleEnd = (e: any) => {
    if (!isDrawing) return;
    const pos = getPos(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx && pos && startPos.current) {
       if (tool === 'line') {
          ctx.strokeStyle = color;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(startPos.current.x + 0.5, startPos.current.y + 0.5);
          ctx.lineTo(pos.x + 0.5, pos.y + 0.5);
          ctx.stroke();
       } else if (tool === 'fill') {
          floodFill(ctx, pos.x, pos.y, color);
       } else if (tool === 'picker') {
          const pixel = ctx.getImageData(pos.x, pos.y, 1, 1).data;
          if (pixel[3] > 0) {
            const hex = `#${((1 << 24) + (pixel[0] << 16) + (pixel[1] << 8) + pixel[2]).toString(16).slice(1)}`;
            setColor(hex);
            setTool('pencil');
          }
       }
    }
    setIsDrawing(false);
    saveState();
  };

  const floodFill = (ctx: CanvasRenderingContext2D, x: number, y: number, fillColor: string) => {
    const imageData = ctx.getImageData(0, 0, gridSize.w, gridSize.h);
    const i = (y * imageData.width + x) * 4;
    const target = [imageData.data[i], imageData.data[i+1], imageData.data[i+2], imageData.data[i+3]];
    const fill = [parseInt(fillColor.slice(1,3), 16), parseInt(fillColor.slice(3,5), 16), parseInt(fillColor.slice(5,7), 16), 255];
    
    if (target.every((v, idx) => v === fill[idx])) return;

    const stack: [number, number][] = [[x, y]];
    while(stack.length) {
      const [cx, cy] = stack.pop()!;
      if (cx < 0 || cx >= gridSize.w || cy < 0 || cy >= gridSize.h) continue;
      const ci = (cy * imageData.width + cx) * 4;
      if (imageData.data[ci] === target[0] && imageData.data[ci+1] === target[1] && imageData.data[ci+2] === target[2] && imageData.data[ci+3] === target[3]) {
        imageData.data[ci] = fill[0]; imageData.data[ci+1] = fill[1]; imageData.data[ci+2] = fill[2]; imageData.data[ci+3] = 255;
        stack.push([cx+1, cy], [cx-1, cy], [cx, cy+1], [cx, cy-1]);
      }
    }
    ctx.putImageData(imageData, 0, 0);
  };

  const undo = () => {
    if (hIndex > 0) {
      const idx = hIndex - 1;
      setHIndex(idx);
      canvasRef.current?.getContext('2d')?.putImageData(history[idx], 0, 0);
      updatePreview();
    }
  };

  return (
    <div className="workspace-container bg-zinc-950 select-none overflow-hidden h-full">
      {/* Ferramentas Mobile: Barra Superior/Lateral compacta */}
      <aside className="lg:w-16 h-14 lg:h-full border-b lg:border-r border-zinc-800 flex lg:flex-col items-center justify-between lg:justify-center p-2 lg:gap-3 bg-zinc-900 z-40">
        <div className="flex lg:flex-col gap-2">
          <ToolIcon active={tool==='pencil'} onClick={()=>setTool('pencil')} icon="P" label="Lápis" />
          <ToolIcon active={tool==='eraser'} onClick={()=>setTool('eraser')} icon="E" label="Apagar" />
          <ToolIcon active={tool==='line'} onClick={()=>setTool('line')} icon="L" label="Linha" />
          <ToolIcon active={tool==='fill'} onClick={()=>setTool('fill')} icon="F" label="Balde" />
          <ToolIcon active={tool==='picker'} onClick={()=>setTool('picker')} icon="K" label="Seringa" />
        </div>
        
        <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl border-2 border-zinc-700 overflow-hidden relative shadow-lg">
           <input type="color" value={color} onChange={e=>setColor(e.target.value)} className="absolute inset-0 w-full h-full scale-150 cursor-pointer" />
        </div>
      </aside>

      {/* Espaço de Trabalho Central - Ocupação Máxima */}
      <section className="flex-1 relative overflow-hidden checkerboard flex items-center justify-center p-4 lg:p-12">
        <div className="relative shadow-2xl transition-transform duration-75" style={{ transform: `scale(${zoom})` }}>
          {/* Camada de Referência (IA) */}
          {activeReference && (
            <img 
              src={activeReference} 
              className="absolute inset-0 w-full h-full z-0 pixel-render pointer-events-none" 
              style={{ opacity: refOpacity }}
            />
          )}

          <canvas
            ref={canvasRef}
            width={gridSize.w}
            height={gridSize.h}
            onMouseDown={handleStart}
            onMouseMove={handleMove}
            onMouseUp={handleEnd}
            onTouchStart={handleStart}
            onTouchMove={handleMove}
            onTouchEnd={handleEnd}
            className="relative z-10 pixel-render bg-transparent border border-zinc-800 shadow-2xl"
            style={{ 
                width: 'min(75vw, 65vh)', 
                height: gridSize.h === 64 ? 'min(150vw, 130vh)' : 'min(75vw, 65vh)',
                imageRendering: 'pixelated'
            }}
          />

          {showGrid && (
             <div className="absolute inset-0 z-20 pointer-events-none opacity-20" 
                  style={{ 
                    backgroundImage: `linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)`,
                    backgroundSize: `calc(100% / ${gridSize.w}) calc(100% / ${gridSize.h})` 
                  }} 
             />
          )}
        </div>

        {/* Zoom e Undo Flutuantes (Bottom Left) */}
        <div className="absolute bottom-6 left-6 flex flex-col gap-3 z-30">
          <div className="flex bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden shadow-2xl">
             <button onClick={()=>setZoom(z=>Math.min(z+0.5, 6))} className="p-4 bg-zinc-800 hover:bg-zinc-700 active:scale-95 transition">➕</button>
             <button onClick={()=>setZoom(1)} className="p-4 font-black text-xs text-zinc-400">100%</button>
             <button onClick={()=>setZoom(z=>Math.max(z-0.5, 0.5))} className="p-4 bg-zinc-800 hover:bg-zinc-700 active:scale-95 transition">➖</button>
          </div>
          <button onClick={undo} disabled={hIndex <= 0} className="w-full py-4 bg-zinc-800 border border-zinc-700 rounded-xl font-bold text-xs disabled:opacity-30 shadow-2xl transition active:scale-95">↩️ DESFAZER</button>
        </div>

        {/* Preview e Toggle Config (Top Right) */}
        <div className="absolute top-6 right-6 z-30 flex flex-col items-end gap-3">
            <button 
                onClick={()=>setShowProps(!showProps)} 
                className={`w-12 h-12 rounded-full shadow-2xl border flex items-center justify-center transition ${showProps ? 'bg-indigo-600 border-indigo-400' : 'bg-zinc-800 border-zinc-700'}`}
            >
                {showProps ? '✕' : '⚙️'}
            </button>
            
            <div className="w-24 h-24 bg-zinc-900/90 border border-zinc-700 rounded-2xl overflow-hidden shadow-2xl flex flex-col p-2 group transition-all hover:scale-105">
                <div className="flex-1 checkerboard rounded-lg overflow-hidden flex items-center justify-center">
                    <canvas ref={previewRef} width={gridSize.w} height={gridSize.h} className="pixel-render w-full h-full object-contain" />
                </div>
                <div className="text-[9px] text-center font-black py-1 text-zinc-500 uppercase tracking-tighter">PREVIEW REAL</div>
            </div>
        </div>
      </section>

      {/* Painel Lateral de Propriedades (Collapsible no mobile) */}
      <aside className={`fixed inset-x-0 bottom-0 lg:relative lg:inset-auto lg:w-80 border-t lg:border-t-0 lg:border-l border-zinc-800 bg-zinc-900/98 backdrop-blur-xl flex flex-col transition-all duration-300 z-50 ${showProps ? 'h-[70vh] lg:h-full p-8' : 'h-0 lg:h-full lg:p-8 overflow-hidden'}`}>
        <div className="flex flex-col gap-8 h-full">
          <div className="flex justify-between items-center">
             <h4 className="font-black text-zinc-200 tracking-[0.15em] text-xs">ESTÚDIO DE ATIVOS</h4>
             <button onClick={()=>setShowProps(false)} className="lg:hidden text-zinc-500 font-bold p-2">✕</button>
          </div>

          <div>
            <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">Molde do Ativo</h4>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={()=>setGridSize({w:32, h:32})} className={`py-3.5 rounded-xl text-xs font-black transition border-2 ${gridSize.h===32 ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400' : 'bg-zinc-800 border-transparent text-zinc-500'}`}>32x32 HEAD</button>
              <button onClick={()=>setGridSize({w:32, h:64})} className={`py-3.5 rounded-xl text-xs font-black transition border-2 ${gridSize.h===64 ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400' : 'bg-zinc-800 border-transparent text-zinc-500'}`}>32x64 BODY</button>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-zinc-800/40 rounded-2xl border border-zinc-700/50">
             <span className="text-xs font-black text-zinc-400 uppercase">Mostrar Grid</span>
             <button onClick={()=>setShowGrid(!showGrid)} className={`w-14 h-7 rounded-full transition-colors relative ${showGrid ? 'bg-indigo-600' : 'bg-zinc-700'}`}>
                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-lg transition-all ${showGrid ? 'left-8' : 'left-1'}`} />
             </button>
          </div>

          {activeReference && (
            <div className="p-4 bg-zinc-800/40 rounded-2xl border border-zinc-700/50">
              <div className="flex justify-between mb-3">
                <h4 className="text-[10px] font-black text-zinc-500 uppercase">Opacidade Referência</h4>
                <span className="text-[10px] font-black text-indigo-400">{Math.round(refOpacity*100)}%</span>
              </div>
              <input type="range" min="0" max="1" step="0.05" value={refOpacity} onChange={e=>setRefOpacity(parseFloat(e.target.value))} className="w-full accent-indigo-500 h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer" />
            </div>
          )}

          <div className="mt-auto flex flex-col gap-4">
             <button onClick={initCanvas} className="w-full py-3 bg-rose-900/10 text-rose-500 border border-rose-900/20 rounded-xl text-[10px] font-black transition uppercase tracking-widest hover:bg-rose-900/20">LIMPAR TELA</button>
             <button onClick={()=>onExport(canvasRef.current!.toDataURL())} className="w-full py-5 bg-white text-black rounded-2xl text-sm font-black shadow-2xl active:scale-95 transition-all">FINALIZAR E EXPORTAR</button>
             <button onClick={()=>onCritiqueRequest(canvasRef.current!.toDataURL())} className="w-full py-5 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-2xl text-sm font-black shadow-xl active:scale-95 transition-all">AVALIAÇÃO MESTRE IA</button>
          </div>
        </div>
      </aside>
    </div>
  );
};

const ToolIcon = ({ active, onClick, icon, label }: any) => (
  <button 
    onClick={onClick}
    className={`w-11 h-11 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center font-black text-base transition-all shadow-md ${active ? 'bg-indigo-600 text-white translate-y-0.5 scale-90 ring-2 ring-indigo-400 ring-offset-2 ring-offset-zinc-900' : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700 active:scale-95'}`}
    title={label}
  >
    {icon}
  </button>
);

export default PixelEditor;

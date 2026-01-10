
import React, { useState, useRef, useEffect, useCallback } from 'react';

interface PixelEditorProps {
  onCritiqueRequest: (dataUrl: string) => void;
  activeReference?: string | null;
  initialData?: string | null;
  onAutoSave?: (dataUrl: string) => void;
}

const PixelEditor: React.FC<PixelEditorProps> = ({ onCritiqueRequest, activeReference, initialData, onAutoSave }) => {
  const [activeLayer, setActiveLayer] = useState<'pixel' | 'sketch'>('pixel');
  const [gridMode, setGridMode] = useState<'head' | 'body'>('head');
  const [color, setColor] = useState('#ffffff');
  const [tool, setTool] = useState<'pencil' | 'eraser' | 'picker'>('pencil');
  const [brushSize, setBrushSize] = useState(1);
  const [zoom, setZoom] = useState(12);
  const [sketchOpacity, setSketchOpacity] = useState(0.4);
  const [showTools, setShowTools] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);

  const pixelCanvasRef = useRef<HTMLCanvasElement>(null);
  const sketchCanvasRef = useRef<HTMLCanvasElement>(null);
  const lastPos = useRef<{ x: number, y: number } | null>(null);

  const dims = gridMode === 'body' ? { w: 32, h: 64 } : { w: 32, h: 32 };

  useEffect(() => {
    const loadInitial = () => {
      if (initialData && pixelCanvasRef.current) {
        const ctx = pixelCanvasRef.current.getContext('2d');
        const img = new Image();
        img.onload = () => {
          ctx?.clearRect(0, 0, dims.w, dims.h);
          ctx?.drawImage(img, 0, 0, dims.w, dims.h);
        };
        img.src = initialData;
      }
    };
    loadInitial();
  }, [gridMode]);

  const getPos = (e: any, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const x = (clientX - rect.left) * (canvas.width / rect.width);
    const y = (clientY - rect.top) * (canvas.height / rect.height);

    return activeLayer === 'pixel' ? { x: Math.floor(x), y: Math.floor(y) } : { x, y };
  };

  const draw = useCallback((from: {x: number, y: number}, to: {x: number, y: number}) => {
    const canvas = activeLayer === 'pixel' ? pixelCanvasRef.current : sketchCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    ctx.beginPath();
    ctx.lineCap = activeLayer === 'pixel' ? 'square' : 'round';
    ctx.lineJoin = activeLayer === 'pixel' ? 'miter' : 'round';
    
    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
    }

    const currentBrushSize = activeLayer === 'pixel' ? brushSize : brushSize * 4;
    ctx.lineWidth = currentBrushSize;

    if (activeLayer === 'pixel' && brushSize === 1 && tool !== 'eraser') {
      ctx.fillRect(to.x, to.y, 1, 1);
    } else {
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
    }
  }, [activeLayer, tool, color, brushSize]);

  const handleStart = (e: any) => {
    const canvas = activeLayer === 'pixel' ? pixelCanvasRef.current : sketchCanvasRef.current;
    if (!canvas) return;
    const pos = getPos(e, canvas);
    if (!pos) return;

    setIsDrawing(true);
    
    if (tool === 'picker') {
      const ctx = canvas.getContext('2d');
      const data = ctx?.getImageData(pos.x, pos.y, 1, 1).data;
      if (data && data[3] > 0) {
        const hex = "#" + ((1 << 24) + (data[0] << 16) + (data[1] << 8) + data[2]).toString(16).slice(1);
        setColor(hex);
        setTool('pencil');
      }
      setIsDrawing(false);
      return;
    }

    lastPos.current = pos;
    draw(pos, pos);
  };

  const handleMove = (e: any) => {
    if (!isDrawing || !lastPos.current) return;
    const canvas = activeLayer === 'pixel' ? pixelCanvasRef.current : sketchCanvasRef.current;
    if (!canvas) return;
    const pos = getPos(e, canvas);
    if (!pos) return;
    
    draw(lastPos.current, pos);
    lastPos.current = pos;
  };

  const handleEnd = () => {
    setIsDrawing(false);
    lastPos.current = null;
    if (activeLayer === 'pixel' && pixelCanvasRef.current && onAutoSave) {
      onAutoSave(pixelCanvasRef.current.toDataURL());
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#030303] relative overflow-hidden">
      {/* Editor Main Canvas Area */}
      <div className="flex-1 checkerboard flex items-center justify-center p-4 touch-none overflow-hidden relative">
        <div 
          className="relative transition-transform duration-200"
          style={{ width: dims.w * zoom, height: dims.h * zoom }}
        >
          {activeReference && (
            <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
              <img src={activeReference} className="w-full h-full object-contain pixel-render" alt="ref" />
            </div>
          )}

          <canvas
            ref={sketchCanvasRef}
            width={1024}
            height={gridMode === 'body' ? 2048 : 1024}
            className="absolute inset-0 z-10 w-full h-full pointer-events-none transition-opacity duration-300"
            style={{ opacity: sketchOpacity }}
          />

          <canvas
            ref={pixelCanvasRef}
            width={dims.w}
            height={dims.h}
            className="absolute inset-0 z-20 w-full h-full bg-transparent pixel-render"
          />

          <div 
            className="absolute inset-0 z-30 cursor-crosshair"
            onMouseDown={handleStart} onMouseMove={handleMove} onMouseUp={handleEnd} onMouseLeave={handleEnd}
            onTouchStart={handleStart} onTouchMove={handleMove} onTouchEnd={handleEnd}
            style={{ touchAction: 'none' }}
          />
          
          {zoom > 10 && (
            <div className="absolute inset-0 pointer-events-none z-40 opacity-[0.03]" 
                 style={{ 
                   backgroundImage: 'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
                   backgroundSize: `${zoom}px ${zoom}px`
                 }} 
            />
          )}
        </div>

        {/* HUD Lateral Flutuante Compacto */}
        <div className="absolute top-4 left-4 flex flex-col gap-2 z-50">
          <button onClick={() => setZoom(z => Math.min(z + 4, 80))} className="w-9 h-9 bg-zinc-900/90 border border-white/10 rounded-lg flex items-center justify-center text-sm active:bg-zinc-800">➕</button>
          <button onClick={() => setZoom(z => Math.max(z - 4, 4))} className="w-9 h-9 bg-zinc-900/90 border border-white/10 rounded-lg flex items-center justify-center text-sm active:bg-zinc-800">➖</button>
          <button onClick={() => {
            const canvas = activeLayer === 'pixel' ? pixelCanvasRef.current : sketchCanvasRef.current;
            canvas?.getContext('2d')?.clearRect(0,0, canvas.width, canvas.height);
          }} className="w-9 h-9 bg-red-950/20 border border-red-500/20 rounded-lg flex items-center justify-center text-xs text-red-400 active:bg-red-900/40">🗑️</button>
        </div>

        <div className="absolute top-4 right-4 flex flex-col gap-2 z-50">
          <button onClick={() => setShowTools(!showTools)} className={`w-10 h-10 rounded-lg border flex items-center justify-center text-sm shadow-xl ${showTools ? 'bg-indigo-600 border-indigo-400' : 'bg-zinc-900/90 border-white/10'}`}>⚙️</button>
          <button onClick={() => onCritiqueRequest(pixelCanvasRef.current!.toDataURL())} className="w-10 h-10 bg-white text-black rounded-lg flex items-center justify-center shadow-xl text-sm active:scale-95 transition-all">🗿</button>
        </div>
      </div>

      {/* FOOTER MULTILAYER COMPACTO */}
      <div className="bg-zinc-950 border-t border-zinc-900 z-[110] px-4 py-2 shrink-0">
        <div className="max-w-xl mx-auto space-y-2">
          {/* Row 1: Tools & Color */}
          <div className="flex items-center gap-3">
            <div className="flex bg-zinc-900 rounded-lg p-0.5 border border-white/5">
              <ToolIcon active={tool === 'pencil'} onClick={() => setTool('pencil')} icon="✏️" />
              <ToolIcon active={tool === 'eraser'} onClick={() => setTool('eraser')} icon="🧹" />
              <ToolIcon active={tool === 'picker'} onClick={() => setTool('picker')} icon="💉" />
            </div>
            
            <div className="flex-1 flex items-center gap-2 bg-zinc-900/50 rounded-lg px-3 py-1.5 h-10">
              <input type="range" min="1" max="10" step="1" value={brushSize} onChange={(e) => setBrushSize(parseInt(e.target.value))} className="flex-1 h-1 bg-zinc-800 rounded-full appearance-none accent-indigo-500" />
              <span className="text-[10px] font-black text-indigo-400 w-4 text-center">{brushSize}</span>
            </div>

            <div className="w-10 h-10 rounded-lg border-2 border-zinc-800 overflow-hidden relative shrink-0 shadow-lg">
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="absolute inset-0 w-[200%] h-[200%] -top-1/2 -left-1/2 cursor-pointer" />
            </div>
          </div>

          {/* Row 2: Mode Selector */}
          <div className="flex gap-2">
             <button 
               onClick={() => setActiveLayer('pixel')}
               className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border ${activeLayer === 'pixel' ? 'bg-indigo-600 text-white border-indigo-400 shadow-[0_0_15px_rgba(79,70,229,0.2)]' : 'bg-zinc-900/30 text-zinc-600 border-white/5'}`}
             >
               Final
             </button>
             <button 
               onClick={() => setActiveLayer('sketch')}
               className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border ${activeLayer === 'sketch' ? 'bg-indigo-600 text-white border-indigo-400 shadow-[0_0_15px_rgba(79,70,229,0.2)]' : 'bg-zinc-900/30 text-zinc-600 border-white/5'}`}
             >
               Esboço
             </button>
          </div>
        </div>
      </div>

      {/* Advanced Settings Modal */}
      <div className={`fixed inset-x-0 bottom-0 bg-zinc-950 border-t border-white/10 p-6 rounded-t-[32px] z-[220] transition-transform duration-500 ease-in-out ${showTools ? 'translate-y-0 shadow-2xl' : 'translate-y-full'}`}>
        <div className="w-10 h-1 bg-zinc-800 rounded-full mx-auto -mt-2 mb-6" />
        
        <div className="space-y-6 max-w-sm mx-auto">
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => {setGridMode('head'); setShowTools(false);}} className={`py-4 rounded-xl border font-bold text-[10px] uppercase tracking-widest ${gridMode === 'head' ? 'bg-white text-black border-white' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}>Graal Head</button>
            <button onClick={() => {setGridMode('body'); setShowTools(false);}} className={`py-4 rounded-xl border font-bold text-[10px] uppercase tracking-widest ${gridMode === 'body' ? 'bg-white text-black border-white' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}>Graal Body</button>
          </div>

          <div className="space-y-2">
             <label className="text-[8px] font-black uppercase text-zinc-500">Opacidade do Esboço: {Math.round(sketchOpacity * 100)}%</label>
             <input type="range" min="0" max="1" step="0.1" value={sketchOpacity} onChange={(e) => setSketchOpacity(parseFloat(e.target.value))} className="w-full h-1 bg-zinc-800 rounded-full appearance-none accent-indigo-500" />
          </div>

          <button onClick={() => {
            const link = document.createElement('a');
            link.download = `wickler_sprite_${Date.now()}.png`;
            link.href = pixelCanvasRef.current!.toDataURL();
            link.click();
            setShowTools(false);
          }} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-indigo-500/20 active:scale-95 transition-all">Exportar PNG</button>
          
          <button onClick={() => setShowTools(false)} className="w-full py-2 text-zinc-600 font-bold uppercase text-[8px] tracking-widest text-center">Fechar</button>
        </div>
      </div>

      <style>{`
        .pixel-render { image-rendering: pixelated; image-rendering: crisp-edges; }
        .checkerboard {
          background-image: linear-gradient(45deg, #080808 25%, transparent 25%), linear-gradient(-45deg, #080808 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #080808 75%), linear-gradient(-45deg, transparent 75%, #080808 75%);
          background-size: 16px 16px; background-color: #030303;
        }
      `}</style>
    </div>
  );
};

const ToolIcon = ({ active, icon, onClick }: any) => (
  <button onClick={onClick} className={`w-9 h-9 rounded-md flex items-center justify-center text-sm transition-all ${active ? 'bg-indigo-600 shadow-md text-white' : 'bg-transparent text-zinc-500'}`}>
    {icon}
  </button>
);

export default PixelEditor;

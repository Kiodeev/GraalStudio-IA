
const createOscillator = (freq: number, type: OscillatorType, duration: number, vol: number) => {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  
  gain.gain.setValueAtTime(vol, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start();
  osc.stop(ctx.currentTime + duration);
};

export const playSound = {
  pixel: () => createOscillator(800, 'square', 0.05, 0.1),
  tool: () => createOscillator(400, 'sine', 0.1, 0.1),
  clear: () => createOscillator(200, 'sawtooth', 0.3, 0.1),
  success: () => {
    createOscillator(600, 'sine', 0.1, 0.1);
    setTimeout(() => createOscillator(800, 'sine', 0.2, 0.1), 100);
  },
  magic: () => {
    [440, 554, 659, 880].forEach((f, i) => {
      setTimeout(() => createOscillator(f, 'triangle', 0.4, 0.05), i * 100);
    });
  }
};

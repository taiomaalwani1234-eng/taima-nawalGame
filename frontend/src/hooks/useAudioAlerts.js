import { useRef, useCallback, useEffect } from 'react';

export function useAudioAlerts() {
  const audioCtxRef = useRef(null);
  const activeOscRef = useRef(null);
  const activeGainRef = useRef(null);
  const intervalRef = useRef(null);

  const getCtx = useCallback(() => {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  const stopAll = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (activeOscRef.current) {
      try { activeOscRef.current.stop(); } catch (e) {}
      activeOscRef.current = null;
    }
    if (activeGainRef.current) {
      activeGainRef.current = null;
    }
  }, []);

  const playGreenPulse = useCallback(() => {
    stopAll();
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(80, ctx.currentTime);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  }, [getCtx, stopAll]);

  const playYellowBeep = useCallback(() => {
    stopAll();
    const ctx = getCtx();

    const beep = () => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    };

    beep();
    intervalRef.current = setInterval(beep, 2000);
  }, [getCtx, stopAll]);

  const playRedSiren = useCallback(() => {
    stopAll();
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, ctx.currentTime);

    const cycleDuration = 1.5;
    const steps = 30;
    for (let i = 0; i < steps; i++) {
      const t = ctx.currentTime + (i * cycleDuration) / steps;
      const freq = 300 + (500 * Math.sin((i / steps) * Math.PI));
      osc.frequency.setValueAtTime(freq, t);
    }

    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);

    activeOscRef.current = osc;
    activeGainRef.current = gain;

    intervalRef.current = setInterval(() => {
      const now = ctx.currentTime;
      for (let i = 0; i < steps; i++) {
        const t = now + (i * cycleDuration) / steps;
        const freq = 300 + (500 * Math.sin((i / steps) * Math.PI));
        try { osc.frequency.setValueAtTime(freq, t); } catch (e) {}
      }
    }, cycleDuration * 1000);
  }, [getCtx, stopAll]);

  const handleStatusChange = useCallback((oldStatus, newStatus) => {
    if (newStatus === 'green') {
      stopAll();
      playGreenPulse();
    } else if (newStatus === 'yellow') {
      stopAll();
      playYellowBeep();
    } else if (newStatus === 'red') {
      stopAll();
      playRedSiren();
    }
  }, [playGreenPulse, playYellowBeep, playRedSiren, stopAll]);

  useEffect(() => {
    return () => {
      stopAll();
      if (audioCtxRef.current) {
        try { audioCtxRef.current.close(); } catch (e) {}
      }
    };
  }, [stopAll]);

  return { handleStatusChange, stopAll, playGreenPulse, playYellowBeep, playRedSiren };
}

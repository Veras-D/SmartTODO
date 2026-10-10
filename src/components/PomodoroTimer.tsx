import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Plus, 
  Timer, 
  Coffee, 
  ChevronDown, 
  ChevronUp,
  Sparkles
} from 'lucide-react';
import { soundManager } from '../utils/sound';

interface PomodoroTimerProps {
  initialMinutes?: number;
}

export const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ initialMinutes = 25 }) => {
  const [targetDuration, setTargetDuration] = useState<number>(initialMinutes * 60);
  const [secondsLeft, setSecondsLeft] = useState<number>(initialMinutes * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [mode, setMode] = useState<'focus' | 'break'>('focus');
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync when initialMinutes changes on new task
  useEffect(() => {
    const defaultSecs = (initialMinutes || 25) * 60;
    setTargetDuration(defaultSecs);
    setSecondsLeft(defaultSecs);
    setIsRunning(false);
    setIsFinished(false);
    setMode('focus');
  }, [initialMinutes]);

  // Timer interval loop
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsRunning(false);
            setIsFinished(true);
            soundManager.playTimerChime();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  const toggleStartPause = () => {
    soundManager.playTimerTick();
    if (isFinished) {
      setSecondsLeft(targetDuration);
      setIsFinished(false);
    }
    setIsRunning(prev => !prev);
  };

  const handleReset = () => {
    soundManager.playTimerTick();
    setIsRunning(false);
    setIsFinished(false);
    setSecondsLeft(targetDuration);
  };

  const handleAddFiveMinutes = () => {
    soundManager.playTimerTick();
    setSecondsLeft(prev => prev + 300);
    setTargetDuration(prev => prev + 300);
    setIsFinished(false);
  };

  const setPreset = (mins: number, timerMode: 'focus' | 'break' = 'focus') => {
    soundManager.playTimerTick();
    setIsRunning(false);
    setIsFinished(false);
    setMode(timerMode);
    setTargetDuration(mins * 60);
    setSecondsLeft(mins * 60);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent = targetDuration > 0 ? ((targetDuration - secondsLeft) / targetDuration) * 100 : 0;

  return (
    <div className="my-5 p-4 rounded-2xl bg-slate-950/70 border border-slate-800 shadow-inner">
      
      {/* Header bar */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-1.5 font-medium">
          {mode === 'focus' ? (
            <Timer className="w-4 h-4 text-indigo-400" />
          ) : (
            <Coffee className="w-4 h-4 text-emerald-400" />
          )}
          <span className="text-slate-300 font-semibold">
            {mode === 'focus' ? 'Focus Pomodoro' : 'Short Break'}
          </span>
          {isRunning && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping ml-1" />
          )}
        </div>

        <button
          onClick={() => setIsMinimized(prev => !prev)}
          className="text-slate-500 hover:text-slate-300 transition p-1"
          title={isMinimized ? 'Expand timer' : 'Minimize timer'}
        >
          {isMinimized ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </button>
      </div>

      {!isMinimized && (
        <div className="mt-3 flex flex-col items-center">
          
          {/* Digital Timer Display */}
          <div className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white my-1">
            {formatTime(secondsLeft)}
          </div>

          {/* Finished Celebration Banner */}
          {isFinished && (
            <div className="mt-2 mb-1 px-3 py-1 rounded-xl bg-indigo-950/60 border border-indigo-500/40 text-indigo-200 text-xs font-medium flex items-center gap-1.5 animate-bounce">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Great job! Take a quick 5m break or finish your task.</span>
            </div>
          )}

          {/* Visual Progress Bar */}
          <div className="w-full bg-slate-800/80 rounded-full h-1.5 my-3 overflow-hidden">
            <div 
              className={`h-1.5 rounded-full transition-all duration-300 ${
                mode === 'focus' ? 'bg-indigo-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-1.5 mb-3 text-[11px]">
            <button
              onClick={() => setPreset(15, 'focus')}
              className={`px-2.5 py-1 rounded-lg border transition ${
                targetDuration === 900 && mode === 'focus'
                  ? 'bg-indigo-600 text-white border-indigo-500 font-semibold'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-300'
              }`}
            >
              15m
            </button>
            <button
              onClick={() => setPreset(25, 'focus')}
              className={`px-2.5 py-1 rounded-lg border transition ${
                targetDuration === 1500 && mode === 'focus'
                  ? 'bg-indigo-600 text-white border-indigo-500 font-semibold'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-300'
              }`}
            >
              25m
            </button>
            <button
              onClick={() => setPreset(45, 'focus')}
              className={`px-2.5 py-1 rounded-lg border transition ${
                targetDuration === 2700 && mode === 'focus'
                  ? 'bg-indigo-600 text-white border-indigo-500 font-semibold'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-300'
              }`}
            >
              45m
            </button>
            <button
              onClick={() => setPreset(5, 'break')}
              className={`px-2.5 py-1 rounded-lg border transition ${
                mode === 'break'
                  ? 'bg-emerald-600 text-white border-emerald-500 font-semibold'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-emerald-300'
              }`}
            >
              ☕ 5m Break
            </button>
          </div>

          {/* Controls: Start/Pause, Reset, +5m */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleStartPause}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition active:scale-95 ${
                isRunning
                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white'
              }`}
            >
              {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isRunning ? 'Pause' : 'Start'}</span>
            </button>

            <button
              onClick={handleAddFiveMinutes}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium border border-slate-800 transition flex items-center gap-1"
              title="Add 5 minutes"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>5m</span>
            </button>

            <button
              onClick={handleReset}
              className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition"
              title="Reset timer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      )}

    </div>
  );
};

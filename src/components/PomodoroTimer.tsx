import React, { useState } from 'react';
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
import { useTaskContext } from '../context/TaskContext';

export const PomodoroTimer: React.FC = () => {
  const {
    timerSecondsLeft,
    timerTargetDuration,
    timerIsRunning,
    timerMode,
    timerIsFinished,
    toggleTimer,
    resetTimer,
    addTimerMinutes,
    setTimerPreset
  } = useTaskContext();

  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent = timerTargetDuration > 0 
    ? ((timerTargetDuration - timerSecondsLeft) / timerTargetDuration) * 100 
    : 0;

  return (
    <div className="my-5 p-4 rounded-2xl bg-slate-950/70 border border-slate-800 shadow-inner">
      
      {/* Header bar */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-1.5 font-medium">
          {timerMode === 'focus' ? (
            <Timer className="w-4 h-4 text-indigo-400" />
          ) : (
            <Coffee className="w-4 h-4 text-emerald-400" />
          )}
          <span className="text-slate-300 font-semibold">
            {timerMode === 'focus' ? 'Focus Pomodoro' : 'Short Break'}
          </span>
          {timerIsRunning && (
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
            {formatTime(timerSecondsLeft)}
          </div>

          {/* Finished Celebration Banner */}
          {timerIsFinished && (
            <div className="mt-2 mb-1 px-3 py-1 rounded-xl bg-indigo-950/60 border border-indigo-500/40 text-indigo-200 text-xs font-medium flex items-center gap-1.5 animate-bounce">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Great job! Take a quick 5m break or finish your task.</span>
            </div>
          )}

          {/* Visual Progress Bar */}
          <div className="w-full bg-slate-800/80 rounded-full h-1.5 my-3 overflow-hidden">
            <div 
              className={`h-1.5 rounded-full transition-all duration-300 ${
                timerMode === 'focus' ? 'bg-indigo-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-1.5 mb-3 text-[11px]">
            <button
              onClick={() => setTimerPreset(15, 'focus')}
              className={`px-2.5 py-1 rounded-lg border transition ${
                timerTargetDuration === 900 && timerMode === 'focus'
                  ? 'bg-indigo-600 text-white border-indigo-500 font-semibold'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-300'
              }`}
            >
              15m
            </button>
            <button
              onClick={() => setTimerPreset(25, 'focus')}
              className={`px-2.5 py-1 rounded-lg border transition ${
                timerTargetDuration === 1500 && timerMode === 'focus'
                  ? 'bg-indigo-600 text-white border-indigo-500 font-semibold'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-300'
              }`}
            >
              25m
            </button>
            <button
              onClick={() => setTimerPreset(45, 'focus')}
              className={`px-2.5 py-1 rounded-lg border transition ${
                timerTargetDuration === 2700 && timerMode === 'focus'
                  ? 'bg-indigo-600 text-white border-indigo-500 font-semibold'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-300'
              }`}
            >
              45m
            </button>
            <button
              onClick={() => setTimerPreset(5, 'break')}
              className={`px-2.5 py-1 rounded-lg border transition ${
                timerMode === 'break'
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
              onClick={toggleTimer}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition active:scale-95 ${
                timerIsRunning
                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white'
              }`}
            >
              {timerIsRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{timerIsRunning ? 'Pause' : 'Start'}</span>
            </button>

            <button
              onClick={() => addTimerMinutes(5)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium border border-slate-800 transition flex items-center gap-1"
              title="Add 5 minutes and keep running"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>5m</span>
            </button>

            <button
              onClick={resetTimer}
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

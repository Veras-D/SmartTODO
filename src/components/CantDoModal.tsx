import React, { useState } from 'react';
import { 
  X, 
  BatteryLow, 
  ShieldAlert, 
  CalendarClock, 
  Archive, 
  ArrowRight,
  Heart
} from 'lucide-react';
import { useTaskContext } from '../context/TaskContext';

interface CantDoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CantDoModal: React.FC<CantDoModalProps> = ({ isOpen, onClose }) => {
  const { activeTask, handleCantDo, rollRandomTask } = useTaskContext();
  const [showBlockerInput, setShowBlockerInput] = useState(false);
  const [blockerText, setBlockerText] = useState('');

  if (!isOpen || !activeTask) return null;

  const handleSelectOption = (reason: 'too_tired' | 'blocked' | 'not_now' | 'cold_storage') => {
    if (reason === 'blocked' && !showBlockerInput) {
      setShowBlockerInput(true);
      return;
    }

    handleCantDo(reason, blockerText);
    setShowBlockerInput(false);
    setBlockerText('');
    onClose();
    // Roll the next adapted task
    setTimeout(() => {
      rollRandomTask();
    }, 150);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2.5 mb-2">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Heart className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Can&rsquo;t do it right now? That&rsquo;s okay!</h2>
            <p className="text-xs text-slate-400">
              No guilt, no penalties. Tell us why so the roulette can adapt:
            </p>
          </div>
        </div>

        {/* Current task pill */}
        <div className="my-4 p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs text-slate-300 truncate">
          <span className="text-slate-500 font-semibold uppercase tracking-wider mr-2">Task:</span>
          {activeTask.title}
        </div>

        {/* Adaptive options */}
        <div className="space-y-2.5">
          
          {/* 1. Too Tired / Low Energy */}
          <button
            onClick={() => handleSelectOption('too_tired')}
            className="w-full p-4 rounded-2xl bg-slate-800/60 hover:bg-emerald-950/30 border border-slate-700/60 hover:border-emerald-500/40 text-left transition group flex items-start gap-3.5"
          >
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-105 transition">
              <BatteryLow className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <span className="text-sm font-bold text-white group-hover:text-emerald-300 block">
                Too tired / Low Energy
              </span>
              <p className="text-xs text-slate-400 mt-0.5">
                Switch roulette to low-spoon easy tasks for this session.
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 self-center" />
          </button>

          {/* 2. Blocked by something */}
          <div className="rounded-2xl bg-slate-800/60 border border-slate-700/60 overflow-hidden">
            <button
              onClick={() => handleSelectOption('blocked')}
              className="w-full p-4 text-left transition group flex items-start gap-3.5 hover:bg-rose-950/20"
            >
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 group-hover:scale-105 transition">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <span className="text-sm font-bold text-white group-hover:text-rose-300 block">
                  I&rsquo;m blocked by something
                </span>
                <p className="text-xs text-slate-400 mt-0.5">
                  Missing information, waiting on someone, or missing tools.
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-rose-400 self-center" />
            </button>

            {/* Expanded Blocker Input */}
            {showBlockerInput && (
              <div className="px-4 pb-4 pt-1 bg-slate-950/60 border-t border-slate-800">
                <label className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                  What is blocking this task?
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={blockerText}
                    onChange={(e) => setBlockerText(e.target.value)}
                    placeholder="e.g. Waiting for reply from Alex, need credit card"
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSelectOption('blocked');
                    }}
                  />
                  <button
                    onClick={() => handleSelectOption('blocked')}
                    className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow"
                  >
                    Park Task
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 3. Not feeling it right now */}
          <button
            onClick={() => handleSelectOption('not_now')}
            className="w-full p-4 rounded-2xl bg-slate-800/60 hover:bg-indigo-950/30 border border-slate-700/60 hover:border-indigo-500/40 text-left transition group flex items-start gap-3.5"
          >
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover:scale-105 transition">
              <CalendarClock className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <span className="text-sm font-bold text-white group-hover:text-indigo-300 block">
                Not feeling it today
              </span>
              <p className="text-xs text-slate-400 mt-0.5">
                Snooze this task until tomorrow with zero guilt.
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 self-center" />
          </button>

          {/* 4. Move to Cold Storage */}
          <button
            onClick={() => handleSelectOption('cold_storage')}
            className="w-full p-4 rounded-2xl bg-slate-800/40 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-left transition group flex items-start gap-3.5"
          >
            <div className="p-2.5 rounded-xl bg-slate-700/30 text-slate-400 border border-slate-700/40 group-hover:scale-105 transition">
              <Archive className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <span className="text-sm font-bold text-slate-300 group-hover:text-white block">
                Freeze in Cold Storage
              </span>
              <p className="text-xs text-slate-400 mt-0.5">
                Park in Someday archive so it stops taking up mental space.
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 self-center" />
          </button>

        </div>

      </div>
    </div>
  );
};

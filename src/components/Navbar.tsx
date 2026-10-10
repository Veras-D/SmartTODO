import React from 'react';
import { 
  Dices, 
  Sparkles, 
  FolderArchive, 
  Plus, 
  Volume2, 
  VolumeX, 
  FileDown, 
  Zap, 
  BatteryLow, 
  Flame, 
  Clock, 
  AlertOctagon 
} from 'lucide-react';
import { useTaskContext } from '../context/TaskContext';
import { RouletteFilter } from '../types/task';

interface NavbarProps {
  currentTab: 'hud' | 'smartify' | 'archive';
  setCurrentTab: (tab: 'hud' | 'smartify' | 'archive') => void;
  onOpenQuickCapture: () => void;
  onOpenKeepImporter: () => void;
  onOpenBankruptcy: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  onOpenQuickCapture,
  onOpenKeepImporter,
  onOpenBankruptcy
}) => {
  const { 
    filter, 
    setFilter, 
    soundEnabled, 
    toggleSound, 
    completedTodayCount, 
    inboxTasks,
    unblockedReadyTasks 
  } = useTaskContext();

  const filterButtons: { id: RouletteFilter; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'all', label: 'All Ready', icon: <Sparkles className="w-3.5 h-3.5" />, color: 'hover:bg-slate-800' },
    { id: 'low_energy', label: 'Low Spoon', icon: <BatteryLow className="w-3.5 h-3.5 text-emerald-400" />, color: 'hover:bg-emerald-950/40' },
    { id: 'deep_focus', label: 'Deep Focus', icon: <Flame className="w-3.5 h-3.5 text-amber-400" />, color: 'hover:bg-amber-950/40' },
    { id: 'quick_win', label: '<10 Mins', icon: <Clock className="w-3.5 h-3.5 text-sky-400" />, color: 'hover:bg-sky-950/40' },
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-30 px-4 py-2.5">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Logo and Brand */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Dices className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-white">SmartTODO</span>
                <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">ADHD Engine</span>
              </div>
              <p className="text-[11px] text-slate-400">Zero-Overwhelm Focus</p>
            </div>
          </div>

          {/* Quick Capture Button (Mobile) */}
          <button
            onClick={onOpenQuickCapture}
            className="md:hidden flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold shadow hover:bg-indigo-500 active:scale-95 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>

        {/* View Navigation Switcher */}
        <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800/80">
          <button
            onClick={() => setCurrentTab('hud')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              currentTab === 'hud'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Dices className="w-3.5 h-3.5" />
            <span>Focus Roulette</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] text-slate-300">
              {unblockedReadyTasks.length}
            </span>
          </button>

          <button
            onClick={() => setCurrentTab('smartify')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              currentTab === 'smartify'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>SMART-ify Lounge</span>
            {inboxTasks.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                {inboxTasks.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setCurrentTab('archive')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              currentTab === 'archive'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <FolderArchive className="w-3.5 h-3.5" />
            <span>Archive</span>
          </button>
        </div>

        {/* Roulette Energy Filter & Actions */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          {/* Energy Spoon Filters (Only shown when on HUD tab) */}
          {currentTab === 'hud' && (
            <div className="hidden lg:flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
              {filterButtons.map(btn => (
                <button
                  key={btn.id}
                  onClick={() => setFilter(btn.id)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${
                    filter === btn.id
                      ? 'bg-slate-800 text-white shadow border border-slate-700'
                      : `text-slate-400 ${btn.color}`
                  }`}
                >
                  {btn.icon}
                  <span>{btn.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Quick Capture (Desktop) */}
          <button
            onClick={onOpenQuickCapture}
            title="Press 'N' to quick dump a task"
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow hover:bg-indigo-500 active:scale-95 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Capture</span>
            <kbd className="ml-1 text-[10px] px-1 py-0.5 rounded bg-indigo-700/60 font-mono">N</kbd>
          </button>

          {/* Google Keep Import */}
          <button
            onClick={onOpenKeepImporter}
            title="Import notes from Google Keep"
            className="p-2 rounded-xl text-slate-400 hover:text-amber-300 hover:bg-amber-950/30 border border-slate-800 transition"
          >
            <FileDown className="w-4 h-4" />
          </button>

          {/* Backlog Bankruptcy */}
          <button
            onClick={onOpenBankruptcy}
            title="Declare Backlog Bankruptcy (Clean fresh start)"
            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 border border-slate-800 transition"
          >
            <AlertOctagon className="w-4 h-4" />
          </button>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            title={soundEnabled ? 'Sound effects on' : 'Sound muted'}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800 transition"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          {/* Daily Win Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-medium text-slate-300">
            <span className="text-emerald-400 font-bold">{completedTodayCount}</span>
            <span className="text-slate-400">Wins today</span>
          </div>
        </div>

      </div>
    </header>
  );
};

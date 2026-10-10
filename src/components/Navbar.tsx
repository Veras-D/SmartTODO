import React, { useState, useRef, useEffect } from 'react';
import { 
  Dices, 
  ListTodo, 
  Plus, 
  MoreVertical, 
  Volume2, 
  VolumeX, 
  FileDown, 
  AlertOctagon, 
  Download,
  CheckCircle2
} from 'lucide-react';
import { useTaskContext } from '../context/TaskContext';

interface NavbarProps {
  currentTab: 'focus' | 'tasks';
  setCurrentTab: (tab: 'focus' | 'tasks') => void;
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
    soundEnabled, 
    toggleSound, 
    completedTodayCount, 
    unblockedReadyTasks,
    tasks
  } = useTaskContext();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as HTMLElement)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Export JSON backup
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(tasks, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `smarttodo_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setIsMenuOpen(false);
  };

  return (
    <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30 px-6 py-3">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        
        {/* Minimal Brand */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm">
            <Dices className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm tracking-tight text-white">SmartTODO</span>
          {completedTodayCount > 0 && (
            <span className="text-[11px] text-emerald-400 font-medium ml-2 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> {completedTodayCount} done today
            </span>
          )}
        </div>

        {/* Clean Center Navigation: Focus vs Tasks */}
        <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800/80">
          <button
            onClick={() => setCurrentTab('focus')}
            className={`flex items-center gap-1.5 px-3.5 py-1 rounded-lg text-xs font-medium transition ${
              currentTab === 'focus'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Dices className="w-3.5 h-3.5" />
            <span>Focus</span>
          </button>

          <button
            onClick={() => setCurrentTab('tasks')}
            className={`flex items-center gap-1.5 px-3.5 py-1 rounded-lg text-xs font-medium transition ${
              currentTab === 'tasks'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ListTodo className="w-3.5 h-3.5" />
            <span>Tasks</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] text-slate-300">
              {unblockedReadyTasks.length}
            </span>
          </button>
        </div>

        {/* Right Actions: + Add Task & Minimal Menu */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenQuickCapture}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Task</span>
          </button>

          {/* Discreet Menu for secondary tools */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen(prev => !prev)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent hover:border-slate-800 transition"
              title="More options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl py-1.5 text-xs z-50 animate-fade-in">
                <button
                  onClick={() => {
                    toggleSound();
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-slate-300 hover:bg-slate-800 transition text-left"
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
                  <span>{soundEnabled ? 'Mute Sounds' : 'Enable Sounds'}</span>
                </button>

                <button
                  onClick={() => {
                    onOpenKeepImporter();
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-slate-300 hover:bg-slate-800 transition text-left"
                >
                  <FileDown className="w-4 h-4 text-amber-400" />
                  <span>Import from Google Keep</span>
                </button>

                <button
                  onClick={() => {
                    onOpenBankruptcy();
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-slate-300 hover:bg-slate-800 transition text-left"
                >
                  <AlertOctagon className="w-4 h-4 text-rose-400" />
                  <span>Fresh Start (Bankruptcy)</span>
                </button>

                <div className="my-1 border-t border-slate-800" />

                <button
                  onClick={handleExportJSON}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition text-left"
                >
                  <Download className="w-4 h-4" />
                  <span>Backup Tasks (JSON)</span>
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </header>
  );
};

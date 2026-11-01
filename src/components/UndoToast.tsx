import React, { useEffect, useState } from 'react';
import { Undo2, X } from 'lucide-react';
import { useTaskContext } from '../context/TaskContext';

/**
 * Small toast that appears after a destructive action and offers a one-click
 * undo. Hidden again after a few seconds, once the moment has passed.
 */
export const UndoToast: React.FC = () => {
  const { lastAction, canUndo, undo } = useTaskContext();
  const [dismissedId, setDismissedId] = useState<number | null>(null);

  useEffect(() => {
    if (!lastAction) return;
    const timer = setTimeout(() => setDismissedId(lastAction.id), 12000);
    return () => clearTimeout(timer);
  }, [lastAction]);

  if (!lastAction || !canUndo || dismissedId === lastAction.id) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-2rem)] max-w-md">
      <div className="animate-fade-in flex items-center gap-2 pl-4 pr-2 py-2.5 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl shadow-black/60">
        <span className="flex-1 min-w-0 text-xs text-slate-300 truncate">
          {lastAction.label}
        </span>

        <button
          type="button"
          onClick={undo}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition active:scale-95 shrink-0"
        >
          <Undo2 className="w-3.5 h-3.5" />
          <span>Undo</span>
          <kbd className="hidden sm:inline text-[10px] bg-indigo-700/80 text-indigo-100 px-1.5 py-0.2 rounded font-mono">
            Ctrl+Z
          </kbd>
        </button>

        <button
          type="button"
          onClick={() => setDismissedId(lastAction.id)}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition shrink-0"
          title="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

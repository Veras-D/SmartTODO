import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertOctagon, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useTaskContext } from '../context/TaskContext';

interface BacklogBankruptcyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BacklogBankruptcyModal: React.FC<BacklogBankruptcyModalProps> = ({
  isOpen,
  onClose
}) => {
  const { declareBankruptcy } = useTaskContext();
  const [clearedCount, setClearedCount] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleExecute = () => {
    const count = declareBankruptcy();
    setClearedCount(count);
  };

  const handleDismiss = () => {
    setClearedCount(null);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative">
        
        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {clearedCount === null ? (
          <>
            {/* Header */}
            <div className="flex items-center gap-2.5 mb-2">
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <AlertOctagon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Declare Backlog Bankruptcy</h2>
                <p className="text-xs text-rose-300 font-medium">The Clinical ADHD Fresh Start</p>
              </div>
            </div>

            <div className="my-4 space-y-3 text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
              <p>
                <b className="text-white">Why this exists:</b> Old tasks accumulate guilt, shame, and emotional resistance (&ldquo;task rot&rdquo;). Trying to force yourself through weeks-old tasks causes executive paralysis.
              </p>
              <p>
                Declaring bankruptcy moves all tasks older than 14 days or repeatedly skipped into <b>Cold Storage</b>.
              </p>
              <p className="text-emerald-400 font-semibold flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>Zero tasks are permanently deleted. They are archived so you can breathe.</span>
              </p>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={handleDismiss}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
              >
                Nevermind
              </button>
              <button
                onClick={handleExecute}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition"
              >
                Declare Bankruptcy & Start Fresh 🕊️
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-white">Fresh Start Activated!</h3>
            <p className="text-xs text-slate-300 mt-1">
              Moved <b className="text-emerald-400">{clearedCount}</b> stale tasks to Cold Storage.
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Your ready pool is refreshed and free of task rot.
            </p>
            <button
              onClick={handleDismiss}
              className="mt-5 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow transition"
            >
              Back to Roulette
            </button>
          </div>
        )}

      </div>
    </div>,
    document.body
  );
};

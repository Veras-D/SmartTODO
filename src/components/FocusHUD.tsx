import React, { useEffect } from 'react';
import { 
  Dices, 
  CheckCircle2, 
  RotateCcw, 
  Scissors, 
  Sparkles, 
  Clock, 
  BatteryLow, 
  Flame, 
  Zap, 
  CheckSquare, 
  Square,
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { useTaskContext } from '../context/TaskContext';
import { EnergyLevel, RouletteFilter } from '../types/task';

interface FocusHUDProps {
  onOpenCantDoModal: () => void;
  onOpenSmartifyTab: () => void;
}

export const FocusHUD: React.FC<FocusHUDProps> = ({ onOpenCantDoModal, onOpenSmartifyTab }) => {
  const { 
    activeTask, 
    rollRandomTask, 
    completeActiveTask, 
    activateFrictionBuster,
    toggleMicroStep, 
    isRolling, 
    unblockedReadyTasks, 
    filter, 
    setFilter 
  } = useTaskContext();

  // Keyboard shortcuts: Space to roll, Enter to complete
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input or textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === 'Space' && !isRolling) {
        e.preventDefault();
        rollRandomTask();
      } else if (e.code === 'Enter' && activeTask) {
        e.preventDefault();
        completeActiveTask();
      } else if (e.key === 'r' && activeTask) {
        e.preventDefault();
        onOpenCantDoModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTask, isRolling, rollRandomTask, completeActiveTask, onOpenCantDoModal]);

  const getEnergyBadge = (level: EnergyLevel) => {
    switch (level) {
      case 'low':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <BatteryLow className="w-3.5 h-3.5" /> Low Spoon / Easy
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Flame className="w-3.5 h-3.5" /> High Energy / Deep Focus
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Zap className="w-3.5 h-3.5" /> Medium Energy
          </span>
        );
    }
  };

  const completedStepsCount = activeTask?.microSteps.filter(s => s.completed).length || 0;
  const totalStepsCount = activeTask?.microSteps.length || 0;
  const progressPercent = totalStepsCount > 0 ? (completedStepsCount / totalStepsCount) * 100 : 0;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 flex flex-col items-center justify-center min-h-[calc(100vh-140px)]">
      
      {/* If No Active Task: Display the Roll Engine */}
      {!activeTask ? (
        <div className="w-full text-center flex flex-col items-center">
          
          {/* Subtle Energy Filter Chips on Mobile */}
          <div className="flex lg:hidden flex-wrap items-center justify-center gap-1.5 mb-6">
            {(['all', 'low_energy', 'deep_focus', 'quick_win'] as RouletteFilter[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                  filter === f
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'bg-slate-900 text-slate-400 border border-slate-800'
                }`}
              >
                {f === 'all' && 'All Ready'}
                {f === 'low_energy' && '🪫 Low Spoon'}
                {f === 'deep_focus' && '⚡ Deep Focus'}
                {f === 'quick_win' && '⏱️ <10 Min'}
              </button>
            ))}
          </div>

          {/* Glowing Roll Trigger */}
          <div className="relative group mb-8">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-sky-500 to-indigo-500 rounded-3xl blur-xl opacity-40 group-hover:opacity-75 transition duration-500 animate-pulse"></div>
            <button
              onClick={rollRandomTask}
              disabled={isRolling || unblockedReadyTasks.length === 0}
              className={`relative px-10 py-10 rounded-3xl bg-slate-900 border-2 border-indigo-500/40 text-white shadow-2xl flex flex-col items-center justify-center gap-4 transition-all duration-300 transform active:scale-95 ${
                unblockedReadyTasks.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:border-indigo-400 hover:scale-105'
              }`}
            >
              <div className={`w-20 h-20 rounded-2xl bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center ${isRolling ? 'animate-spin' : ''}`}>
                <Dices className="w-12 h-12 text-indigo-400" />
              </div>
              <div>
                <span className="text-2xl font-black tracking-tight text-white block">
                  {isRolling ? 'Rolling...' : 'Roll Next Mission'}
                </span>
                <span className="text-xs text-indigo-300/80 font-mono mt-1 block">
                  Press [Space] to Roll
                </span>
              </div>
            </button>
          </div>

          {/* Status count and reassurance */}
          <div className="max-w-md bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 text-center">
            {unblockedReadyTasks.length > 0 ? (
              <>
                <p className="text-sm font-medium text-slate-300">
                  <span className="text-indigo-400 font-bold text-base">{unblockedReadyTasks.length}</span> unblocked tasks are primed and ready for action.
                </p>
                <p className="text-xs text-slate-400 mt-1.5">
                  The app chooses for you. Zero decision fatigue, zero overwhelming list.
                </p>
              </>
            ) : (
              <>
                <div className="flex items-center justify-center gap-2 text-amber-400 mb-2">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-bold text-sm">No Unblocked Ready Tasks</span>
                </div>
                <p className="text-xs text-slate-400">
                  You have cleared all ready tasks or tasks are waiting for clarification in the inbox.
                </p>
                <button
                  onClick={onOpenSmartifyTab}
                  className="mt-3.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 transition shadow"
                >
                  Go to SMART-ify Lounge
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        /* If Active Task Is Selected: Display Single Focused Task HUD */
        <div className="w-full flex flex-col items-center">
          
          {/* Active Card */}
          <div className="w-full bg-slate-900/90 border-2 border-indigo-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden transition-all duration-300">
            
            {/* Top metadata badges */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                {getEnergyBadge(activeTask.energyLevel)}
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                  <Clock className="w-3.5 h-3.5 text-slate-400" /> ~{activeTask.estimatedMinutes} mins
                </span>
              </div>
              <span className="text-[11px] font-semibold text-indigo-400/80 uppercase tracking-wider bg-indigo-950/40 px-2.5 py-1 rounded-lg border border-indigo-800/40">
                Single Focus Mode
              </span>
            </div>

            {/* Task Title */}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug mb-3">
              {activeTask.title}
            </h1>

            {/* Definition of Done Box (DoD) */}
            {activeTask.definitionOfDone && (
              <div className="mb-5 p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-500/20 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-bold text-indigo-300 uppercase tracking-wide block">
                    Definition of Done:
                  </span>
                  <p className="text-sm text-slate-200 mt-0.5">
                    {activeTask.definitionOfDone}
                  </p>
                </div>
              </div>
            )}

            {/* Friction Buster Starter Banner (if active) */}
            {activeTask.frictionBusterStep && (
              <div className="mb-5 p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 flex items-start gap-2.5 animate-pulse">
                <Scissors className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-bold text-emerald-300 uppercase tracking-wide block">
                    ⚡ 2-Minute Micro-Starter:
                  </span>
                  <p className="text-sm font-semibold text-emerald-100 mt-0.5">
                    {activeTask.frictionBusterStep}
                  </p>
                </div>
              </div>
            )}

            {/* Micro-Steps Breakdown (Goblin-style checklist) */}
            {activeTask.microSteps && activeTask.microSteps.length > 0 && (
              <div className="mb-6 bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Micro-Steps ({completedStepsCount}/{totalStepsCount})
                  </span>
                  <span className="text-xs text-indigo-400 font-mono font-bold">
                    {Math.round(progressPercent)}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-800 rounded-full h-1.5 mb-3.5 overflow-hidden">
                  <div 
                    className="bg-indigo-500 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                <div className="space-y-2">
                  {activeTask.microSteps.map(step => (
                    <button
                      key={step.id}
                      onClick={() => toggleMicroStep(activeTask.id, step.id)}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left text-sm transition ${
                        step.completed 
                          ? 'bg-slate-900/50 text-slate-500 line-through' 
                          : 'bg-slate-800/60 text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      {step.completed ? (
                        <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <span>{step.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Notes (if any) */}
            {activeTask.notes && (
              <p className="text-xs text-slate-400 italic mb-6">
                💡 Note: {activeTask.notes}
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-slate-800/80">
              
              {/* Done Button (Primary) */}
              <button
                onClick={completeActiveTask}
                className="w-full sm:flex-1 py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-base shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2.5 transition"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Mark as Done! 🎉</span>
                <kbd className="hidden sm:inline-block text-[10px] px-1.5 py-0.5 rounded bg-emerald-700/60 font-mono">
                  Enter
                </kbd>
              </button>

              {/* Can't Do It Now (Adaptive Skip Modal) */}
              <button
                onClick={onOpenCantDoModal}
                className="w-full sm:w-auto py-3.5 px-5 rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-semibold text-sm border border-slate-700/80 flex items-center justify-center gap-2 transition"
              >
                <RotateCcw className="w-4 h-4 text-amber-400" />
                <span>Can't do it now</span>
                <kbd className="hidden sm:inline-block text-[10px] px-1 py-0.5 rounded bg-slate-700 text-slate-300 font-mono">
                  R
                </kbd>
              </button>

              {/* Friction Buster Button */}
              {!activeTask.frictionBusterStep && (
                <button
                  onClick={activateFrictionBuster}
                  title="Shrink this task to a 2-minute starter step"
                  className="w-full sm:w-auto py-3.5 px-4 rounded-2xl bg-slate-800 hover:bg-emerald-950/40 hover:text-emerald-300 active:scale-95 text-slate-300 font-medium text-sm border border-slate-700/80 flex items-center justify-center gap-1.5 transition"
                >
                  <Scissors className="w-4 h-4 text-emerald-400" />
                  <span>Shrink to 2m</span>
                </button>
              )}

              {/* Direct Reroll */}
              <button
                onClick={rollRandomTask}
                title="Reroll without recording reason"
                className="p-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700/80 transition"
              >
                <Dices className="w-5 h-5" />
              </button>

            </div>

          </div>

          {/* Guilt-Free Guidance Note below card */}
          <p className="text-xs text-slate-400 mt-4 text-center flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Stuck or feeling resistance? Click &ldquo;Can&rsquo;t do it now&rdquo; &mdash; there is zero penalty for rerolling.</span>
          </p>

        </div>
      )}

    </div>
  );
};

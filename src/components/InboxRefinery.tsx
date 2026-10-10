import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Dices, 
  Play, 
  Trash2, 
  SkipForward, 
  Save, 
  X, 
  Inbox,
  AlertCircle
} from 'lucide-react';
import { useTaskContext } from '../context/TaskContext';
import { Task, EnergyLevel, GTDContext, RecurrenceInterval, Blocker } from '../types/task';
import { generateId } from '../utils/storage';
import { CustomSelect, SelectOption } from './CustomSelect';
import { soundManager } from '../utils/sound';

const GTD_CONTEXT_OPTIONS: SelectOption[] = [
  { value: '@computer', label: '@computer', icon: <span>💻</span> },
  { value: '@phone', label: '@phone', icon: <span>📱</span> },
  { value: '@errands', label: '@errands', icon: <span>🚗</span> },
  { value: '@home', label: '@home', icon: <span>🏠</span> },
  { value: '@anywhere', label: '@anywhere', icon: <span>🌍</span> },
];

const RECURRENCE_OPTIONS: SelectOption[] = [
  { value: 'none', label: 'No repeat' },
  { value: 'daily', label: 'Daily' },
  { value: 'every_2_days', label: 'Every 2 days' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

interface InboxRefineryProps {
  onClose: () => void;
  onStartFocus?: () => void;
}

export const InboxRefinery: React.FC<InboxRefineryProps> = ({ onClose, onStartFocus }) => {
  const { 
    tasks, 
    createOrUpdateTask, 
    deleteTask, 
    startTaskDirectly 
  } = useTaskContext();

  const inboxTasks = tasks.filter(t => t.status === 'inbox');
  const [initialTotal] = useState(inboxTasks.length);
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentTask: Task | undefined = inboxTasks[currentIndex] || inboxTasks[0];

  // Local Form State
  const [title, setTitle] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [definitionOfDone, setDefinitionOfDone] = useState('');
  const [gtdContext, setGtdContext] = useState<GTDContext>('@computer');
  const [recurrence, setRecurrence] = useState<RecurrenceInterval>('none');
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel>('medium');
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(25);
  const [newBlockerText, setNewBlockerText] = useState('');
  const [blockers, setBlockers] = useState<Blocker[]>([]);

  // Sync form when currentTask changes
  useEffect(() => {
    if (currentTask) {
      setTitle(currentTask.title || '');
      setNextAction(currentTask.nextAction || '');
      setDefinitionOfDone(currentTask.definitionOfDone || '');
      setGtdContext(currentTask.gtdContext || '@computer');
      setRecurrence(currentTask.recurrence || 'none');
      setEnergyLevel(currentTask.energyLevel || 'medium');
      setEstimatedMinutes(currentTask.estimatedMinutes || 25);
      setBlockers(currentTask.blockers || []);
      setNewBlockerText('');
    }
  }, [currentTask?.id]);

  // Adjust index if out of bounds after deletion or ready move
  useEffect(() => {
    if (inboxTasks.length > 0 && currentIndex >= inboxTasks.length) {
      setCurrentIndex(inboxTasks.length - 1);
    }
  }, [inboxTasks.length, currentIndex]);

  const addBlocker = () => {
    if (!newBlockerText.trim()) return;
    setBlockers(prev => [...prev, { id: generateId(), text: newBlockerText.trim(), resolved: false }]);
    setNewBlockerText('');
  };

  const removeBlocker = (id: string) => {
    setBlockers(prev => prev.filter(b => b.id !== id));
  };

  // 1. Skip: leaves in inbox, advances to next
  const handleSkip = () => {
    soundManager.playSkipSound();
    if (currentIndex < inboxTasks.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Loop back to start if skipping last item
      setCurrentIndex(0);
    }
  };

  // 2. Save Draft: saves details, remains in inbox, advances
  const handleSaveDraft = () => {
    if (!currentTask) return;
    soundManager.playRollTick(1.2);
    createOrUpdateTask({
      id: currentTask.id,
      title: title.trim() || currentTask.title,
      nextAction: nextAction.trim() || undefined,
      definitionOfDone: definitionOfDone.trim() || undefined,
      gtdContext,
      recurrence: recurrence !== 'none' ? recurrence : undefined,
      energyLevel,
      estimatedMinutes,
      blockers,
      status: 'inbox'
    });

    if (currentIndex < inboxTasks.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  // 3. Move to Ready Stage: marks ready (or blocked if unresolved blockers), advances
  const handleMoveToReady = () => {
    if (!currentTask) return;
    soundManager.playLandSound();
    const hasUnresolved = blockers.some(b => !b.resolved);
    createOrUpdateTask({
      id: currentTask.id,
      title: title.trim() || currentTask.title,
      nextAction: nextAction.trim() || undefined,
      definitionOfDone: definitionOfDone.trim() || undefined,
      gtdContext,
      recurrence: recurrence !== 'none' ? recurrence : undefined,
      energyLevel,
      estimatedMinutes,
      blockers,
      status: hasUnresolved ? 'blocked' : 'ready'
    });

    // The current task is removed from inboxTasks, so current index naturally points to next task
  };

  // 4. Start Now: save details and immediately begin focus
  const handleStartNow = () => {
    if (!currentTask) return;
    createOrUpdateTask({
      id: currentTask.id,
      title: title.trim() || currentTask.title,
      nextAction: nextAction.trim() || undefined,
      definitionOfDone: definitionOfDone.trim() || undefined,
      gtdContext,
      recurrence: recurrence !== 'none' ? recurrence : undefined,
      energyLevel,
      estimatedMinutes,
      blockers,
      status: 'ready'
    });
    startTaskDirectly(currentTask.id);
    if (onStartFocus) {
      onStartFocus();
    }
    onClose();
  };

  // 5. Delete raw task
  const handleDelete = () => {
    if (!currentTask) return;
    soundManager.playSkipSound();
    deleteTask(currentTask.id);
  };

  // All Inbox tasks completed
  if (inboxTasks.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-5 shadow-lg">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Inbox Zero! 🎉</h2>
        <p className="text-xs text-slate-400 max-w-sm mx-auto mb-8 leading-relaxed">
          You refined all your raw thoughts into clarified, actionable tasks. Your focus pool is primed and ready.
        </p>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold shadow transition"
          >
            Back to Tasks
          </button>
          {onStartFocus && (
            <button
              onClick={() => {
                onClose();
                onStartFocus();
              }}
              className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition flex items-center gap-1.5"
            >
              <Dices className="w-4 h-4" />
              <span>Go to Focus Pool 🎲</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  const processedCount = Math.max(0, initialTotal - inboxTasks.length);
  const progressPercent = Math.min(100, Math.round((processedCount / (initialTotal || 1)) * 100));

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 animate-fade-in">
      
      {/* Top Header & Progress */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-600/10 text-indigo-400 border border-indigo-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white">Inbox Refinery (GTD)</h1>
            <p className="text-[11px] text-slate-400">
              Clarifying task {currentIndex + 1} of {inboxTasks.length} ({inboxTasks.length} left)
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition flex items-center gap-1"
        >
          <span>Stop Refining</span>
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-slate-900 rounded-full mb-6 overflow-hidden border border-slate-800">
        <div 
          className="h-full bg-indigo-500 transition-all duration-300 rounded-full"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Main Task Refinement Card */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
        
        {/* Task Title (Editable) */}
        <div>
          <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase block mb-1">
            Raw Thought / Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700/80 text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            placeholder="Task title..."
          />
        </div>

        {/* 1. Next Physical Action */}
        <div>
          <label className="text-[11px] font-medium text-slate-400 block mb-1">
            Next Physical Action
          </label>
          <input
            type="text"
            value={nextAction}
            onChange={(e) => setNextAction(e.target.value)}
            placeholder="Immediate starting physical step (e.g. Open browser, find order #)..."
            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* 2. Definition of Done */}
        <div>
          <label className="text-[11px] font-medium text-slate-400 block mb-1">
            Definition of Done (Outcome)
          </label>
          <input
            type="text"
            value={definitionOfDone}
            onChange={(e) => setDefinitionOfDone(e.target.value)}
            placeholder="Finish line / Outcome when this task is complete..."
            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* 3. Properties 2x2 Grid: Context, Repeat, Energy, Timer */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1">
              Context
            </label>
            <CustomSelect
              value={gtdContext}
              onChange={(val) => setGtdContext(val as GTDContext)}
              options={GTD_CONTEXT_OPTIONS}
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1">
              Repeat Schedule
            </label>
            <CustomSelect
              value={recurrence}
              onChange={(val) => setRecurrence(val as RecurrenceInterval)}
              options={RECURRENCE_OPTIONS}
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1">
              Energy (Spoons)
            </label>
            <div className="grid grid-cols-3 gap-1">
              {(['low', 'medium', 'high'] as EnergyLevel[]).map(lvl => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setEnergyLevel(lvl)}
                  className={`py-2 rounded-xl border text-xs font-medium capitalize transition ${
                    energyLevel === lvl
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1">
              Timer Duration
            </label>
            <div className="grid grid-cols-4 gap-1">
              {[15, 25, 45, 60].map(mins => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setEstimatedMinutes(mins)}
                  className={`py-2 rounded-xl border text-xs font-medium transition ${
                    estimatedMinutes === mins
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow font-semibold'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {mins}m
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 4. Blockers (Optional) */}
        <div>
          <label className="text-[11px] font-medium text-rose-400/90 block mb-1">
            Blockers / Waiting For (Optional)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newBlockerText}
              onChange={(e) => setNewBlockerText(e.target.value)}
              placeholder="Waiting on person, missing asset..."
              className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addBlocker();
                }
              }}
            />
            <button
              type="button"
              onClick={addBlocker}
              className="px-3.5 py-2 rounded-xl bg-rose-950/40 text-rose-300 border border-rose-800/80 hover:bg-rose-900/40 text-xs font-medium transition shrink-0"
            >
              + Add
            </button>
          </div>

          {blockers.length > 0 && (
            <div className="mt-2 space-y-1">
              {blockers.map(b => (
                <div key={b.id} className="flex items-center justify-between text-xs text-rose-300 bg-rose-950/20 px-2.5 py-1.5 rounded-lg border border-rose-900/30">
                  <span>🚫 {b.text}</span>
                  <button
                    type="button"
                    onClick={() => removeBlocker(b.id)}
                    className="text-slate-400 hover:text-rose-400 text-[11px]"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons Toolbar */}
        <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
          
          {/* Left actions: Trash & Skip */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDelete}
              className="p-2.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 border border-transparent hover:border-rose-900/40 transition"
              title="Delete raw thought (junk/unneeded)"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleSkip}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition flex items-center gap-1.5"
              title="Skip for now (leave in inbox and see next)"
            >
              <SkipForward className="w-3.5 h-3.5" />
              <span>Skip</span>
            </button>
          </div>

          {/* Right actions: Save Draft, Ready 🎲, Start Now ▶ */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveDraft}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition flex items-center gap-1.5"
              title="Save details and move to next task (remains in inbox)"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Draft</span>
            </button>

            <button
              type="button"
              onClick={handleMoveToReady}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition flex items-center gap-1.5"
              title="Clarification complete: send to ready stage"
            >
              <Dices className="w-3.5 h-3.5" />
              <span>Ready Stage 🎲</span>
            </button>

            <button
              type="button"
              onClick={handleStartNow}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition flex items-center gap-1.5"
              title="Clarification complete: start focusing immediately!"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Start Now ▶</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};

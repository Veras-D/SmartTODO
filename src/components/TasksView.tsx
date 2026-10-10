import React, { useState } from 'react';
import { 
  Play, 
  Trash2, 
  CheckCircle2, 
  BatteryLow, 
  Flame, 
  Zap, 
  Clock, 
  ShieldAlert, 
  ChevronDown, 
  ChevronUp, 
  ArrowRight,
  Sparkles,
  Inbox,
  Dices,
  CheckSquare,
  Square,
  Plus,
  Repeat
} from 'lucide-react';
import { useTaskContext } from '../context/TaskContext';
import { Task, EnergyLevel, GTDContext, Blocker, RecurrenceInterval } from '../types/task';
import { generateId } from '../utils/storage';

interface TasksViewProps {
  onSelectTaskForFocus: () => void;
}

export const TasksView: React.FC<TasksViewProps> = ({ onSelectTaskForFocus }) => {
  const { 
    tasks, 
    addQuickTask, 
    createOrUpdateTask, 
    deleteTask,
    startTaskDirectly 
  } = useTaskContext();

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [activeTab, setActiveTab] = useState<'inbox' | 'ready' | 'blocked' | 'done' | 'all'>('inbox');
  const [clarifyingTaskId, setClarifyingTaskId] = useState<string | null>(null);

  // GTD Edit Form States
  const [nextAction, setNextAction] = useState('');
  const [gtdContext, setGtdContext] = useState<GTDContext>('@computer');
  const [definitionOfDone, setDefinitionOfDone] = useState('');
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel>('medium');
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(25);
  const [recurrence, setRecurrence] = useState<RecurrenceInterval>('none');
  const [newStepText, setNewStepText] = useState('');
  const [newBlockerText, setNewBlockerText] = useState('');

  // Quick add from top input -> defaults to Inbox
  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    addQuickTask(newTaskTitle.trim());
    setNewTaskTitle('');
    setActiveTab('inbox');
  };

  const handleStartNow = (taskId: string) => {
    startTaskDirectly(taskId);
    onSelectTaskForFocus();
  };

  const openGtdClarifier = (task: Task) => {
    if (clarifyingTaskId === task.id) {
      setClarifyingTaskId(null);
      return;
    }
    setClarifyingTaskId(task.id);
    setNextAction(task.nextAction || '');
    setGtdContext(task.gtdContext || '@computer');
    setDefinitionOfDone(task.definitionOfDone || '');
    setEnergyLevel(task.energyLevel || 'medium');
    setEstimatedMinutes(task.estimatedMinutes || 25);
    setRecurrence(task.recurrence || 'none');
    setNewStepText('');
    setNewBlockerText('');
  };

  const saveGtdDetails = (task: Task, markAsReady: boolean = false) => {
    const updatedStatus = markAsReady
      ? (task.blockers && task.blockers.some(b => !b.resolved) ? 'blocked' : 'ready')
      : task.status;

    createOrUpdateTask({
      id: task.id,
      title: task.title,
      nextAction: nextAction.trim() || undefined,
      gtdContext,
      definitionOfDone: definitionOfDone.trim() || undefined,
      energyLevel,
      estimatedMinutes,
      recurrence: recurrence !== 'none' ? recurrence : undefined,
      status: updatedStatus
    });

    setClarifyingTaskId(null);
  };

  const addMicroStepToTask = (task: Task) => {
    if (!newStepText.trim()) return;
    const updated = [...task.microSteps, { id: generateId(), title: newStepText.trim(), completed: false }];
    createOrUpdateTask({ id: task.id, title: task.title, microSteps: updated });
    setNewStepText('');
  };

  const addBlockerToTask = (task: Task) => {
    if (!newBlockerText.trim()) return;
    const updated: Blocker[] = [...task.blockers, { id: generateId(), text: newBlockerText.trim(), resolved: false }];
    createOrUpdateTask({ id: task.id, title: task.title, blockers: updated, status: 'blocked' });
    setNewBlockerText('');
  };

  const resolveBlocker = (taskId: string, blockerId: string) => {
    const target = tasks.find(t => t.id === taskId);
    if (!target) return;
    const updated = target.blockers.map(b => b.id === blockerId ? { ...b, resolved: true } : b);
    const hasUnresolved = updated.some(b => !b.resolved);
    createOrUpdateTask({
      ...target,
      blockers: updated,
      status: hasUnresolved ? 'blocked' : 'ready'
    });
  };

  const inboxCount = tasks.filter(t => t.status === 'inbox').length;
  const readyCount = tasks.filter(t => t.status === 'ready').length;
  const blockedCount = tasks.filter(t => t.status === 'blocked').length;
  const doneCount = tasks.filter(t => t.status === 'completed').length;

  const filteredTasks = tasks.filter(t => {
    if (activeTab === 'inbox') return t.status === 'inbox';
    if (activeTab === 'ready') return t.status === 'ready';
    if (activeTab === 'blocked') return t.status === 'blocked' || t.blockers.some(b => !b.resolved);
    if (activeTab === 'done') return t.status === 'completed';
    return true; // all
  });

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 animate-fade-in">
      
      {/* 1. Fast Capture into Inbox */}
      <form onSubmit={handleQuickAdd} className="mb-6">
        <div className="flex gap-2 p-1.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg focus-within:border-indigo-500 transition">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Dump a thought into Inbox... (Press Enter)"
            className="flex-1 px-3 py-2 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!newTaskTitle.trim()}
            className={`px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold shadow transition ${
              !newTaskTitle.trim() ? 'opacity-40 cursor-not-allowed' : 'hover:bg-indigo-500 active:scale-95'
            }`}
          >
            Capture
          </button>
        </div>
      </form>

      {/* 2. GTD Tabs */}
      <div className="flex items-center gap-1.5 mb-5 border-b border-slate-900 pb-2 text-xs overflow-x-auto">
        <button
          onClick={() => setActiveTab('inbox')}
          className={`px-3 py-1.5 rounded-xl font-medium transition flex items-center gap-1.5 shrink-0 ${
            activeTab === 'inbox'
              ? 'bg-indigo-600 text-white font-semibold shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Inbox className="w-3.5 h-3.5" />
          <span>Inbox</span>
          {inboxCount > 0 && (
            <span className="text-[10px] bg-indigo-900/80 px-1.5 py-0.2 rounded-full font-bold">
              {inboxCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('ready')}
          className={`px-3 py-1.5 rounded-xl font-medium transition flex items-center gap-1.5 shrink-0 ${
            activeTab === 'ready'
              ? 'bg-indigo-600 text-white font-semibold shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Dices className="w-3.5 h-3.5" />
          <span>Ready (Roulette)</span>
          <span className="text-[10px] text-slate-300 bg-slate-800 px-1.5 py-0.2 rounded-full">
            {readyCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('blocked')}
          className={`px-3 py-1.5 rounded-xl font-medium transition flex items-center gap-1.5 shrink-0 ${
            activeTab === 'blocked'
              ? 'bg-indigo-600 text-white font-semibold shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Blocked</span>
          {blockedCount > 0 && (
            <span className="text-[10px] text-rose-300 bg-rose-950/60 px-1.5 py-0.2 rounded-full font-bold">
              {blockedCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('done')}
          className={`px-3 py-1.5 rounded-xl font-medium transition flex items-center gap-1.5 shrink-0 ${
            activeTab === 'done'
              ? 'bg-indigo-600 text-white font-semibold shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Done</span>
          <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded-full">
            {doneCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1.5 rounded-xl font-medium transition flex items-center gap-1.5 shrink-0 ${
            activeTab === 'all'
              ? 'bg-indigo-600 text-white font-semibold shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>All</span>
          <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded-full">
            {tasks.length}
          </span>
        </button>
      </div>

      {/* 3. Task Cards List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="p-10 text-center text-slate-500 text-xs bg-slate-900/40 rounded-3xl border border-slate-900">
            {activeTab === 'inbox' ? 'Your inbox is clear! Capture raw ideas above.' : 'No tasks in this list.'}
          </div>
        ) : (
          filteredTasks.map(task => {
            const isClarifying = clarifyingTaskId === task.id;
            return (
              <div
                key={task.id}
                className="rounded-2xl bg-slate-900 border border-slate-800/80 p-4 transition hover:border-slate-700 shadow-sm"
              >
                {/* Main Item Row */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {task.status === 'inbox' && (
                        <span className="text-[10px] font-bold text-amber-300 bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-900/40">
                          Inbox
                        </span>
                      )}
                      {task.gtdContext && (
                        <span className="text-[10px] text-indigo-300 bg-indigo-950/40 px-2 py-0.5 rounded-md border border-indigo-900/40">
                          {task.gtdContext}
                        </span>
                      )}
                      {task.energyLevel === 'low' && (
                        <span className="text-[10px] text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-900/40">
                          Low Spoon
                        </span>
                      )}
                      {task.status === 'blocked' && (
                        <span className="text-[10px] text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded-md border border-rose-900/40">
                          Blocked
                        </span>
                      )}
                      {task.recurrence && task.recurrence !== 'none' && (
                        <span className="text-[10px] text-sky-300 bg-sky-950/40 px-2 py-0.5 rounded-md border border-sky-900/40 flex items-center gap-1">
                          <Repeat className="w-3 h-3 text-sky-400" />
                          <span>
                            {task.recurrence === 'every_2_days' && 'Every 2 days'}
                            {task.recurrence === 'daily' && 'Daily'}
                            {task.recurrence === 'weekly' && 'Weekly'}
                            {task.recurrence === 'monthly' && 'Monthly'}
                            {task.nextDueDate && ` (Due ${task.nextDueDate})`}
                          </span>
                        </span>
                      )}
                    </div>

                    <h3 className={`text-base font-semibold truncate ${
                      task.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-100'
                    }`}>
                      {task.title}
                    </h3>

                    {task.nextAction && (
                      <p className="text-xs text-indigo-300 mt-1 flex items-center gap-1">
                        <ArrowRight className="w-3 h-3 text-indigo-400 shrink-0" />
                        <span><b>Next:</b> {task.nextAction}</span>
                      </p>
                    )}
                  </div>

                  {/* Actions: Start Now, Clarify, Delete */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Start Now button (available even directly from Inbox!) */}
                    {task.status !== 'completed' && (
                      <button
                        onClick={() => handleStartNow(task.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow transition active:scale-95"
                        title="Start this task now with Pomodoro timer"
                      >
                        <Play className="w-3 h-3 fill-white" />
                        <span>Start</span>
                      </button>
                    )}

                    {/* GTD Clarify Toggle Button */}
                    <button
                      onClick={() => openGtdClarifier(task)}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border transition flex items-center gap-1 ${
                        isClarifying
                          ? 'bg-indigo-600 text-white border-indigo-500'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                      }`}
                    >
                      <span>GTD</span>
                      {isClarifying ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>

                    <button
                      onClick={() => deleteTask(task.id)}
                      className="p-1.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Show Blockers */}
                {task.blockers && task.blockers.length > 0 && !isClarifying && (
                  <div className="mt-2.5 pt-2 border-t border-slate-800/60 text-xs">
                    {task.blockers.map(b => (
                      <div key={b.id} className="flex items-center justify-between text-[11px] text-rose-300">
                        <span>🚫 {b.text}</span>
                        {!b.resolved && (
                          <button
                            onClick={() => resolveBlocker(task.id, b.id)}
                            className="text-emerald-400 hover:underline font-semibold ml-2"
                          >
                            Unblock ✓
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Inline GTD Clarifier Section */}
                {isClarifying && (
                  <div className="mt-4 pt-4 border-t border-slate-800 space-y-3.5 text-xs animate-fade-in bg-slate-950/60 p-4 rounded-2xl">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-indigo-400 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Clarify based on GTD Method</span>
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Make actionable & unblocked
                      </span>
                    </div>

                    {/* 1. Next Physical Action */}
                    <div>
                      <label className="text-slate-300 font-medium block mb-1">
                        1. Next Physical Action (Immediate starting step)
                      </label>
                      <input
                        type="text"
                        value={nextAction}
                        onChange={(e) => setNextAction(e.target.value)}
                        placeholder="e.g. Open Gmail, find order confirmation, click reply"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    {/* 2. Context & Energy */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-slate-300 font-medium block mb-1">
                          2. GTD Context (@location/tool)
                        </label>
                        <select
                          value={gtdContext}
                          onChange={(e) => setGtdContext(e.target.value as GTDContext)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                        >
                          <option value="@computer">💻 @computer</option>
                          <option value="@phone">📱 @phone</option>
                          <option value="@errands">🚗 @errands</option>
                          <option value="@home">🏠 @home</option>
                          <option value="@anywhere">🌍 @anywhere</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-slate-300 font-medium block mb-1">
                          3. Energy Level (Spoons)
                        </label>
                        <div className="grid grid-cols-3 gap-1">
                          {(['low', 'medium', 'high'] as EnergyLevel[]).map(lvl => (
                            <button
                              key={lvl}
                              type="button"
                              onClick={() => setEnergyLevel(lvl)}
                              className={`py-1.5 rounded-lg border text-[11px] font-medium capitalize transition ${
                                energyLevel === lvl
                                  ? 'bg-indigo-600 text-white border-indigo-500 shadow'
                                  : 'bg-slate-900 text-slate-400 border-slate-800'
                              }`}
                            >
                              {lvl}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* 3. Desired Outcome / Definition of Done */}
                    <div>
                      <label className="text-slate-300 font-medium block mb-1">
                        4. Desired Outcome (Done When...)
                      </label>
                      <input
                        type="text"
                        value={definitionOfDone}
                        onChange={(e) => setDefinitionOfDone(e.target.value)}
                        placeholder="e.g. Email sent and confirmation receipt saved"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    {/* 4. Estimated Time */}
                    <div>
                      <label className="text-slate-300 font-medium block mb-1">
                        5. Estimated Pomodoro Focus Time
                      </label>
                      <div className="flex gap-2">
                        {[5, 15, 25, 45].map(mins => (
                          <button
                            key={mins}
                            type="button"
                            onClick={() => setEstimatedMinutes(mins)}
                            className={`px-3 py-1 rounded-lg border text-xs ${
                              estimatedMinutes === mins
                                ? 'bg-indigo-600 text-white border-indigo-500 font-semibold'
                                : 'bg-slate-900 text-slate-400 border-slate-800'
                            }`}
                          >
                            {mins}m
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 5. Recurrence Rule */}
                    <div>
                      <label className="text-slate-300 font-medium block mb-1 flex items-center gap-1.5">
                        <Repeat className="w-3.5 h-3.5 text-indigo-400" />
                        <span>6. Recurrence (Repeating task schedule)</span>
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                        {[
                          { id: 'none', label: 'No Repeat' },
                          { id: 'daily', label: 'Daily' },
                          { id: 'every_2_days', label: 'Every 2 days' },
                          { id: 'weekly', label: 'Weekly' },
                          { id: 'monthly', label: 'Monthly' }
                        ].map(opt => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setRecurrence(opt.id as RecurrenceInterval)}
                            className={`py-1.5 px-2 rounded-xl border text-[11px] font-medium transition ${
                              recurrence === opt.id
                                ? 'bg-indigo-600 text-white border-indigo-500 shadow'
                                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 6. Blockers / Waiting For */}
                    <div>
                      <label className="text-rose-300 font-medium block mb-1">
                        7. Blockers / Waiting For (Optional)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newBlockerText}
                          onChange={(e) => setNewBlockerText(e.target.value)}
                          placeholder="Waiting for reply from X, missing credit card..."
                          className="flex-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addBlockerToTask(task);
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => addBlockerToTask(task)}
                          className="px-3 py-1.5 rounded-xl bg-rose-950/40 text-rose-300 border border-rose-800 text-xs font-semibold"
                        >
                          + Blocker
                        </button>
                      </div>
                    </div>

                    {/* Clarifier Action Buttons */}
                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => saveGtdDetails(task, false)}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                      >
                        Save Draft
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => saveGtdDetails(task, true)}
                          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow flex items-center gap-1.5"
                        >
                          <Dices className="w-3.5 h-3.5" />
                          <span>Move to Ready Pool 🎲</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            saveGtdDetails(task, true);
                            handleStartNow(task.id);
                          }}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow flex items-center gap-1.5"
                        >
                          <Play className="w-3.5 h-3.5 fill-white" />
                          <span>Start Now ▶</span>
                        </button>
                      </div>
                    </div>

                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};

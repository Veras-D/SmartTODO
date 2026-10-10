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
import { CustomSelect, SelectOption } from './CustomSelect';
import { InboxRefinery } from './InboxRefinery';

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

interface TasksViewProps {
  onSelectTaskForFocus: () => void;
}

export const TasksView: React.FC<TasksViewProps> = ({ onSelectTaskForFocus }) => {
  const { 
    tasks, 
    addQuickTask, 
    createOrUpdateTask, 
    deleteTask,
    startTaskDirectly,
    moveToInbox
  } = useTaskContext();

  const [isRefining, setIsRefining] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [activeTab, setActiveTab] = useState<'inbox' | 'in_progress' | 'ready' | 'blocked' | 'done' | 'all'>('inbox');
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
  const inProgressCount = tasks.filter(t => t.status === 'in_progress').length;
  const readyCount = tasks.filter(t => t.status === 'ready').length;
  const blockedCount = tasks.filter(t => t.status === 'blocked').length;
  const doneCount = tasks.filter(t => t.status === 'completed').length;

  const filteredTasks = tasks.filter(t => {
    if (activeTab === 'inbox') return t.status === 'inbox';
    if (activeTab === 'in_progress') return t.status === 'in_progress';
    if (activeTab === 'ready') return t.status === 'ready';
    if (activeTab === 'blocked') return t.status === 'blocked' || t.blockers.some(b => !b.resolved);
    if (activeTab === 'done') return t.status === 'completed';
    return true; // all
  });

  if (isRefining) {
    return (
      <InboxRefinery
        onClose={() => setIsRefining(false)}
        onStartFocus={onSelectTaskForFocus}
      />
    );
  }

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
          onClick={() => setActiveTab('in_progress')}
          className={`px-3 py-1.5 rounded-xl font-medium transition flex items-center gap-1.5 shrink-0 ${
            activeTab === 'in_progress'
              ? 'bg-indigo-600 text-white font-semibold shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-indigo-400" />
          <span>In Progress</span>
          {inProgressCount > 0 && (
            <span className="text-[10px] bg-indigo-900/80 text-indigo-200 px-1.5 py-0.2 rounded-full font-bold">
              {inProgressCount}
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

      {/* Refine Inbox Banner */}
      {activeTab === 'inbox' && inboxCount > 0 && (
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-indigo-950/25 border border-indigo-800/40 mb-4 animate-fade-in shadow-sm">
          <div className="flex items-center gap-2 text-xs text-indigo-300">
            <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>
              <b>{inboxCount}</b> raw {inboxCount === 1 ? 'thought' : 'thoughts'} waiting to be clarified
            </span>
          </div>

          <button
            onClick={() => setIsRefining(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition flex items-center gap-1.5 active:scale-95 shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Refine Inbox ✨</span>
          </button>
        </div>
      )}

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
                      {task.status === 'in_progress' && (
                        <span className="text-[10px] font-bold text-sky-300 bg-sky-950/50 px-2 py-0.5 rounded-md border border-sky-800/50 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-sky-400" />
                          <span>In Progress</span>
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

                  {/* Actions: Start/Resume, Clarify, Delete */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Start / Resume button */}
                    {task.status !== 'completed' && (
                      <button
                        onClick={() => handleStartNow(task.id)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-white text-xs font-bold shadow transition active:scale-95 ${
                          task.status === 'in_progress'
                            ? 'bg-sky-600 hover:bg-sky-500'
                            : 'bg-emerald-600 hover:bg-emerald-500'
                        }`}
                        title={task.status === 'in_progress' ? 'Resume this paused task' : 'Start this task now with Pomodoro timer'}
                      >
                        <Play className="w-3 h-3 fill-white" />
                        <span>{task.status === 'in_progress' ? 'Resume' : 'Start'}</span>
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

                    {/* Move back to Inbox button */}
                    {task.status !== 'inbox' && task.status !== 'completed' && (
                      <button
                        onClick={() => moveToInbox(task.id)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-amber-300 hover:bg-amber-950/30 transition"
                        title="Move back to Inbox"
                      >
                        <Inbox className="w-4 h-4" />
                      </button>
                    )}

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

                {/* Minimalist GTD Clarifier Section */}
                {isClarifying && (
                  <div className="mt-4 pt-4 border-t border-slate-800 space-y-3.5 text-xs animate-fade-in bg-slate-950/70 p-4 rounded-2xl border border-slate-800/60">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-indigo-400 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Clarify & Unblock</span>
                      </span>
                      <span className="text-[11px] text-slate-500">
                        GTD Action Clarifier
                      </span>
                    </div>

                    {/* Next Physical Action */}
                    <div>
                      <label className="text-[11px] font-medium text-slate-400 block mb-1">
                        Next Physical Action
                      </label>
                      <input
                        type="text"
                        value={nextAction}
                        onChange={(e) => setNextAction(e.target.value)}
                        placeholder="Immediate first step (e.g. Open Gmail, find order #)..."
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    {/* Desired Outcome / Definition of Done */}
                    <div>
                      <label className="text-[11px] font-medium text-slate-400 block mb-1">
                        Definition of Done
                      </label>
                      <input
                        type="text"
                        value={definitionOfDone}
                        onChange={(e) => setDefinitionOfDone(e.target.value)}
                        placeholder="Outcome / Finish line..."
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    {/* Context, Recurrence, Energy, Time Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                                  : 'bg-slate-900 text-slate-400 border-slate-700/80 hover:text-white'
                              }`}
                            >
                              {lvl}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-medium text-slate-400 block mb-1">
                          Focus Duration
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
                                  : 'bg-slate-900 text-slate-400 border-slate-700/80 hover:text-white'
                              }`}
                            >
                              {mins}m
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Blockers / Waiting For */}
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
                          className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
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
                          className="px-3.5 py-2 rounded-xl bg-rose-950/40 text-rose-300 border border-rose-800/80 hover:bg-rose-900/40 text-xs font-medium transition shrink-0"
                        >
                          + Add
                        </button>
                      </div>
                    </div>

                    {/* Clarifier Actions */}
                    <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => saveGtdDetails(task, false)}
                          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
                        >
                          Save Draft
                        </button>

                        {task.status !== 'inbox' && (
                          <button
                            type="button"
                            onClick={() => moveToInbox(task.id)}
                            className="px-3 py-2 rounded-xl bg-amber-950/30 hover:bg-amber-900/40 text-amber-300 border border-amber-800/50 text-xs font-medium transition flex items-center gap-1.5"
                            title="Move back to Inbox"
                          >
                            <Inbox className="w-3.5 h-3.5" />
                            <span>To Inbox</span>
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => saveGtdDetails(task, true)}
                          className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition flex items-center gap-1.5 active:scale-95"
                        >
                          <Dices className="w-3.5 h-3.5" />
                          <span>Ready Pool 🎲</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            saveGtdDetails(task, true);
                            handleStartNow(task.id);
                          }}
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition flex items-center gap-1.5 active:scale-95"
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

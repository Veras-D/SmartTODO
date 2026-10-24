import React, { useState, useEffect } from 'react';
import { 
  Dices, 
  CheckCircle2, 
  RotateCcw, 
  Scissors, 
  BatteryLow, 
  Square, 
  CheckSquare,
  Sparkles,
  Plus,
  Repeat,
  Inbox,
  Play,
  Clock,
  Link,
  ArrowRight,
  FolderKanban
} from 'lucide-react';
import { useTaskContext } from '../context/TaskContext';
import { PomodoroTimer } from './PomodoroTimer';

interface FocusHUDProps {
  onOpenTasksTab: () => void;
}

export const FocusHUD: React.FC<FocusHUDProps> = ({ onOpenTasksTab }) => {
  const { 
    activeTask, 
    rollRandomTask, 
    completeActiveTask, 
    continueTaskLater,
    resumeTask,
    moveToReadyPool,
    handleCantDo,
    activateFrictionBuster,
    toggleMicroStep, 
    isRolling, 
    unblockedReadyTasks, 
    unblockedInboxTasks,
    readyTasks,
    inProgressTasks,
    filter, 
    setFilter,
    addQuickTask,
    createOrUpdateTask,
    tasks,
    projects,
    startTaskDirectly,
    moveToInbox
  } = useTaskContext();

  const tasksBlockedByActive = activeTask
    ? tasks.filter(t => t.blockers.some(b => !b.resolved && b.blockedByTaskId === activeTask.id))
    : [];

  const inboxTasks = tasks.filter(t => t.status === 'inbox');

  const [showSkipOptions, setShowSkipOptions] = useState(false);
  const [blockerInput, setBlockerInput] = useState('');
  const [isAddingBlocker, setIsAddingBlocker] = useState(false);
  const [inlineTaskTitle, setInlineTaskTitle] = useState('');

  // Keyboard shortcuts: Space to roll, Enter to complete
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.code === 'Space' && !isRolling && unblockedReadyTasks.length > 0) {
        e.preventDefault();
        rollRandomTask();
      } else if (e.code === 'Enter' && activeTask) {
        e.preventDefault();
        completeActiveTask();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTask, isRolling, unblockedReadyTasks.length, rollRandomTask, completeActiveTask]);

  // Reset skip options on task change
  useEffect(() => {
    setShowSkipOptions(false);
    setIsAddingBlocker(false);
    setBlockerInput('');
  }, [activeTask?.id]);

  const handleSkipReason = (reason: 'too_tired' | 'blocked' | 'not_now') => {
    if (reason === 'blocked' && !isAddingBlocker) {
      setIsAddingBlocker(true);
      return;
    }
    handleCantDo(reason, blockerInput);
    setShowSkipOptions(false);
    setIsAddingBlocker(false);
    setBlockerInput('');
    // Automatically roll the next task
    setTimeout(() => {
      rollRandomTask();
    }, 120);
  };

  const handleAddToInbox = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inlineTaskTitle.trim()) return;
    addQuickTask(inlineTaskTitle.trim());
    setInlineTaskTitle('');
  };

  const handleStartImmediately = () => {
    if (!inlineTaskTitle.trim()) return;
    const task = addQuickTask(inlineTaskTitle.trim());
    startTaskDirectly(task.id);
    setInlineTaskTitle('');
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 flex flex-col items-center justify-center min-h-[calc(100vh-140px)]">
      
      {/* 1. Idle View */}
      {!activeTask ? (
        <div className="w-full flex flex-col items-center text-center animate-fade-in">
          
          {/* 📌 Continue Later (In Progress) Shelf */}
          {inProgressTasks.length > 0 && (
            <div className="w-full max-w-md mb-8 p-4 rounded-3xl bg-indigo-950/25 border border-indigo-800/40 shadow-xl text-left animate-fade-in">
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Continue Later ({inProgressTasks.length})</span>
                </span>
                <span className="text-[10px] text-slate-500">
                  Paused & ready to resume
                </span>
              </div>

              <div className="space-y-2">
                {inProgressTasks.map(task => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900 border border-slate-800/90 hover:border-indigo-500/40 transition shadow-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        {task.gtdContext && (
                          <span className="text-[10px] text-indigo-300 bg-indigo-950/60 px-1.5 py-0.2 rounded border border-indigo-800/40">
                            {task.gtdContext}
                          </span>
                        )}
                        {task.estimatedMinutes && (
                          <span className="text-[10px] text-slate-400">
                            ~{task.estimatedMinutes}m
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-semibold text-white truncate">
                        {task.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => resumeTask(task.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow transition active:scale-95"
                        title="Resume this task now"
                      >
                        <Play className="w-3 h-3 fill-white" />
                        <span>Resume</span>
                      </button>

                      <button
                        onClick={() => moveToReadyPool(task.id)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-indigo-300 hover:bg-indigo-950/30 transition text-[11px]"
                        title="Move back to Ready Roulette pool"
                      >
                        <Dices className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => moveToInbox(task.id)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-amber-300 hover:bg-amber-950/30 transition text-[11px]"
                        title="Move back to Inbox"
                      >
                        <Inbox className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {unblockedReadyTasks.length === 0 ? (
            /* Clean Empty State: Add task to Inbox or start directly */
            <div className="w-full max-w-md p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center shadow-xl">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mx-auto mb-4">
                <Dices className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-bold text-white mb-1">
                {inProgressTasks.length > 0 ? 'Start Another Task' : 'Your Focus Deck is Empty'}
              </h2>
              <p className="text-xs text-slate-400 mb-5">
                {inProgressTasks.length > 0 
                  ? 'Capture a new thought or start another focus session.' 
                  : 'Capture a task to send to your Inbox, or start focusing right away.'}
              </p>

              <form onSubmit={handleAddToInbox} className="space-y-3">
                <input
                  type="text"
                  value={inlineTaskTitle}
                  onChange={(e) => setInlineTaskTitle(e.target.value)}
                  placeholder="What's on your mind? (Press Enter for Inbox)"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  autoFocus
                />
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={!inlineTaskTitle.trim()}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold shadow disabled:opacity-40 transition flex items-center justify-center gap-1.5"
                  >
                    <Inbox className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Send to Inbox</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleStartImmediately}
                    disabled={!inlineTaskTitle.trim()}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-semibold shadow disabled:opacity-40 transition flex items-center justify-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Start Now ▶</span>
                  </button>
                </div>
              </form>

              {/* Notice if user already has tasks sitting in Inbox */}
              {inboxTasks.length > 0 && (
                <div className="mt-5 pt-4 border-t border-slate-800/80">
                  <p className="text-[11px] text-slate-400 mb-2">
                    You have <span className="text-indigo-400 font-semibold">{inboxTasks.length}</span> {inboxTasks.length === 1 ? 'task' : 'tasks'} waiting in your Inbox
                  </p>
                  <button
                    onClick={onOpenTasksTab}
                    className="px-4 py-1.5 rounded-xl bg-indigo-950/40 border border-indigo-800/60 hover:bg-indigo-900/40 text-indigo-300 text-xs font-medium transition"
                  >
                    Go to Inbox to Clarify 📥
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Normal Idle Roll Button */
            <>
              <button
                onClick={rollRandomTask}
                disabled={isRolling}
                className="w-full max-w-sm p-10 rounded-3xl bg-slate-900 border border-slate-800 text-white shadow-2xl flex flex-col items-center justify-center gap-4 transition-all duration-200 active:scale-95 hover:border-indigo-500/60 hover:bg-slate-900/90 hover:scale-105"
              >
                <div className={`w-16 h-16 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center ${isRolling ? 'animate-spin' : ''}`}>
                  <Dices className="w-9 h-9" />
                </div>

                <div>
                  <span className="text-xl font-bold text-white block">
                    {isRolling ? 'Picking...' : 'What should I do now?'}
                  </span>
                  <span className="text-xs text-slate-400 mt-1 block">
                    Click or press Space
                  </span>
                </div>
              </button>

              {/* Calming status indicator */}
              <div className="mt-6 flex items-center gap-3 text-xs text-slate-400">
                <span>
                  {unblockedReadyTasks.length} {unblockedReadyTasks.length === 1 ? 'task' : 'tasks'} ready to focus
                  {unblockedInboxTasks.length > 0 && readyTasks.length > 0 && (
                    <span className="text-slate-500 text-[11px] ml-1">
                      ({readyTasks.length} ready • {unblockedInboxTasks.length} inbox)
                    </span>
                  )}
                  {unblockedInboxTasks.length > 0 && readyTasks.length === 0 && (
                    <span className="text-amber-400/90 text-[11px] ml-1 font-medium">
                      (from Inbox)
                    </span>
                  )}
                </span>
                <span>•</span>
                <button
                  onClick={() => setFilter(filter === 'low_energy' ? 'all' : 'low_energy')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border transition ${
                    filter === 'low_energy'
                      ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40'
                      : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-300'
                  }`}
                >
                  <BatteryLow className="w-3.5 h-3.5" />
                  <span>{filter === 'low_energy' ? 'Low energy active' : 'Low energy?'}</span>
                </button>
              </div>

              {/* 📥 Inbox Shelf - Direct Start in Focus Deck */}
              {unblockedInboxTasks.length > 0 && (
                <div className="w-full max-w-md mt-8 p-4 rounded-3xl bg-slate-900 border border-slate-800/90 shadow-xl text-left animate-fade-in">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Inbox className="w-3.5 h-3.5 text-amber-400" />
                      <span>Start from Inbox ({unblockedInboxTasks.length})</span>
                    </span>
                    <button
                      onClick={onOpenTasksTab}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium transition flex items-center gap-1"
                      title="Clarify tasks with GTD method"
                    >
                      <span>Clarify in GTD</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {unblockedInboxTasks.map(task => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition shadow-sm"
                      >
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-semibold text-white truncate">
                            {task.title}
                          </h4>
                          <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-500">
                            <span className="text-amber-400/90 font-medium bg-amber-950/40 px-1.5 py-0.2 rounded border border-amber-900/40">
                              Inbox
                            </span>
                            {task.gtdContext && (
                              <>
                                <span>•</span>
                                <span className="text-indigo-400">{task.gtdContext}</span>
                              </>
                            )}
                            {task.estimatedMinutes && (
                              <>
                                <span>•</span>
                                <span>~{task.estimatedMinutes}m</span>
                              </>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => startTaskDirectly(task.id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow transition active:scale-95 shrink-0"
                          title="Start this inbox task now with Pomodoro focus"
                        >
                          <Play className="w-3 h-3 fill-white" />
                          <span>Start</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      ) : (
        /* 2. Active Focus Task Card */
        <div className="w-full animate-fade-in">
          
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-7 shadow-2xl relative">
            
            {/* Top subtle indicators */}
            <div className="flex items-center justify-between text-xs text-slate-400 mb-4">
              <span className="flex items-center gap-1.5 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Current Mission</span>
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                {activeTask.projectId && (() => {
                  const project = projects.find(p => p.id === activeTask.projectId);
                  if (!project) return null;
                  return (
                    <span className="text-[11px] font-medium text-indigo-300 bg-indigo-950/50 px-2 py-0.5 rounded-md border border-indigo-900/50 flex items-center gap-1 shadow-sm">
                      <FolderKanban className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{project.title}</span>
                    </span>
                  );
                })()}
                {tasksBlockedByActive.length > 0 && (
                  <span 
                    className="text-[11px] text-amber-300 bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-800/40 flex items-center gap-1 font-medium"
                    title={`Completing this task will unblock: ${tasksBlockedByActive.map(t => t.title).join(', ')}`}
                  >
                    <Link className="w-3 h-3 text-amber-400" />
                    <span>Blocks {tasksBlockedByActive.length} {tasksBlockedByActive.length === 1 ? 'task' : 'tasks'}</span>
                  </span>
                )}
                {activeTask.estimatedMinutes && (
                  <span className="text-slate-500">
                    ~{activeTask.estimatedMinutes} mins
                  </span>
                )}
                {activeTask.recurrence && activeTask.recurrence !== 'none' && (
                  <span className="text-[11px] text-sky-400 bg-sky-950/40 px-2 py-0.5 rounded-md border border-sky-900/40 flex items-center gap-1">
                    <Repeat className="w-3 h-3" />
                    <span>
                      {activeTask.recurrence === 'every_2_days' && 'Every 2 days'}
                      {activeTask.recurrence === 'daily' && 'Daily'}
                      {activeTask.recurrence === 'weekly' && 'Weekly'}
                      {activeTask.recurrence === 'monthly' && 'Monthly'}
                    </span>
                  </span>
                )}
              </div>
            </div>

            {/* Big readable Task Title */}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug mb-3">
              {activeTask.title}
            </h1>

            {/* Definition of Done (DoD) */}
            {activeTask.definitionOfDone && (
              <p className="text-xs text-indigo-300/90 mb-4 flex items-center gap-1.5 bg-indigo-950/30 p-2.5 rounded-xl border border-indigo-900/40">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span><b>Done when:</b> {activeTask.definitionOfDone}</span>
              </p>
            )}

            {/* Friction Buster Starter (if active) */}
            {activeTask.frictionBusterStep && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-start gap-2 text-xs text-emerald-200">
                <Scissors className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><b>Just do 2 minutes:</b> {activeTask.frictionBusterStep}</span>
              </div>
            )}

            {/* Pomodoro Focus Timer */}
            <PomodoroTimer />

            {/* Micro-Steps (if present) */}
            {activeTask.microSteps && activeTask.microSteps.length > 0 && (
              <div className="my-4 space-y-1.5 border-t border-slate-800/80 pt-3">
                {activeTask.microSteps.map(step => (
                  <button
                    key={step.id}
                    onClick={() => toggleMicroStep(activeTask.id, step.id)}
                    className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-left text-xs transition ${
                      step.completed ? 'text-slate-500 line-through' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {step.completed ? (
                      <CheckSquare className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <Square className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    )}
                    <span>{step.title}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Notes (if any) */}
            {activeTask.notes && (
              <p className="text-xs text-slate-400 italic mb-4">
                Note: {activeTask.notes}
              </p>
            )}

            {/* Action Buttons: Done, Continue Later, Can't do it now */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 pt-4 border-t border-slate-800/80">
              
              {/* Primary Complete Button */}
              <button
                onClick={completeActiveTask}
                className="flex-1 py-3 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Done!</span>
              </button>

              {/* Continue Later Button */}
              <button
                onClick={() => continueTaskLater(activeTask.id)}
                className="py-3 px-4 rounded-2xl bg-indigo-600/20 hover:bg-indigo-600/30 active:scale-95 text-indigo-300 font-semibold text-xs border border-indigo-500/40 flex items-center gap-1.5 transition"
                title="Pause this task to continue later"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Continue Later</span>
              </button>

              {/* Can't do it now / Skip */}
              <button
                onClick={() => setShowSkipOptions(prev => !prev)}
                className="py-3 px-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-400 font-medium text-xs border border-slate-700 flex items-center gap-1.5 transition"
                title="Skip or park task"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Skip</span>
              </button>

              {/* Tiny Friction Buster button */}
              {!activeTask.frictionBusterStep && (
                <button
                  onClick={activateFrictionBuster}
                  title="Make this task smaller (2-min start)"
                  className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-emerald-300 border border-slate-700 transition shrink-0"
                >
                  <Scissors className="w-4 h-4" />
                </button>
              )}

            </div>

            {/* Notification of other paused tasks so user never forgets */}
            {inProgressTasks.filter(t => t.id !== activeTask.id).length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5 text-indigo-300 text-[11px]">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>
                    {inProgressTasks.filter(t => t.id !== activeTask.id).length} other {inProgressTasks.filter(t => t.id !== activeTask.id).length === 1 ? 'task' : 'tasks'} waiting in Continue Later
                  </span>
                </span>
                <button
                  onClick={() => continueTaskLater(activeTask.id)}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium hover:underline"
                >
                  Switch tasks ⇄
                </button>
              </div>
            )}

            {/* Quick Minimal Inline Skip Reason Chips */}
            {showSkipOptions && (
              <div className="mt-4 pt-4 border-t border-slate-800 animate-fade-in">
                <span className="text-[11px] text-slate-400 block mb-2 font-medium">
                  Why can&rsquo;t you do it right now?
                </span>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleSkipReason('too_tired')}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-950/40 text-slate-300 hover:text-emerald-300 text-xs font-medium border border-slate-700 transition flex items-center gap-1.5"
                  >
                    <span>😴 Too tired (give me something easy)</span>
                  </button>

                  <button
                    onClick={() => handleSkipReason('blocked')}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 text-xs font-medium border border-slate-700 transition flex items-center gap-1.5"
                  >
                    <span>🛑 Blocked by something</span>
                  </button>

                  <button
                    onClick={() => handleSkipReason('not_now')}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-medium border border-slate-700 transition"
                  >
                    <span>⏭️ Just skip for today</span>
                  </button>

                  {activeTask && (
                    <button
                      onClick={() => {
                        moveToInbox(activeTask.id);
                        setShowSkipOptions(false);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-amber-950/40 text-slate-300 hover:text-amber-300 text-xs font-medium border border-slate-700 transition flex items-center gap-1.5"
                    >
                      <Inbox className="w-3.5 h-3.5 text-amber-400" />
                      <span>Send back to Inbox</span>
                    </button>
                  )}
                </div>

                {/* Inline Blocker input if clicked */}
                {isAddingBlocker && (
                  <div className="mt-3 flex gap-2">
                    <input
                      type="text"
                      value={blockerInput}
                      onChange={(e) => setBlockerInput(e.target.value)}
                      placeholder="What is blocking you? (e.g. Waiting for reply)"
                      className="flex-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSkipReason('blocked');
                      }}
                    />
                    <button
                      onClick={() => handleSkipReason('blocked')}
                      className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow"
                    >
                      Park Task
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
};

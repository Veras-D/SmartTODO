import React, { useState } from 'react';
import { 
  Zap, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  ShieldAlert, 
  Clock, 
  BatteryLow, 
  Flame, 
  Scissors, 
  ArrowRight,
  ListPlus,
  Dices
} from 'lucide-react';
import { useTaskContext } from '../context/TaskContext';
import { Task, EnergyLevel, MicroStep, Blocker } from '../types/task';
import { generateId } from '../utils/storage';

export const SmartifyLounge: React.FC = () => {
  const { 
    inboxTasks, 
    createOrUpdateTask, 
    deleteTask,
    unblockedReadyTasks 
  } = useTaskContext();

  const [selectedTask, setSelectedTask] = useState<Task | null>(() => inboxTasks[0] || null);

  // Form state
  const [title, setTitle] = useState('');
  const [definitionOfDone, setDefinitionOfDone] = useState('');
  const [notes, setNotes] = useState('');
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel>('medium');
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(15);
  const [microSteps, setMicroSteps] = useState<MicroStep[]>([]);
  const [newStepInput, setNewStepInput] = useState('');
  const [blockers, setBlockers] = useState<Blocker[]>([]);
  const [newBlockerInput, setNewBlockerInput] = useState('');
  const [frictionBuster, setFrictionBuster] = useState('');

  // When a task is selected, populate form
  const handleSelectTask = (task: Task) => {
    setSelectedTask(task);
    setTitle(task.title);
    setDefinitionOfDone(task.definitionOfDone || '');
    setNotes(task.notes || '');
    setEnergyLevel(task.energyLevel);
    setEstimatedMinutes(task.estimatedMinutes);
    setMicroSteps(task.microSteps || []);
    setBlockers(task.blockers || []);
    setFrictionBuster(task.frictionBusterStep || '');
  };

  // Add micro step
  const handleAddMicroStep = () => {
    if (!newStepInput.trim()) return;
    setMicroSteps(prev => [...prev, { id: generateId(), title: newStepInput.trim(), completed: false }]);
    setNewStepInput('');
  };

  // Add blocker
  const handleAddBlocker = () => {
    if (!newBlockerInput.trim()) return;
    setBlockers(prev => [...prev, { id: generateId(), text: newBlockerInput.trim(), resolved: false }]);
    setNewBlockerInput('');
  };

  // Save changes and mark as Ready
  const handleSaveAsReady = () => {
    if (!title.trim()) return;

    createOrUpdateTask({
      id: selectedTask?.id,
      title: title.trim(),
      definitionOfDone: definitionOfDone.trim(),
      notes: notes.trim(),
      status: blockers.length > 0 ? 'blocked' : 'ready',
      energyLevel,
      estimatedMinutes,
      microSteps,
      blockers,
      frictionBusterStep: frictionBuster.trim()
    });

    // Move to next inbox task if available
    const remaining = inboxTasks.filter(t => t.id !== selectedTask?.id);
    if (remaining.length > 0) {
      handleSelectTask(remaining[0]);
    } else {
      setSelectedTask(null);
      resetForm();
    }
  };

  const resetForm = () => {
    setTitle('');
    setDefinitionOfDone('');
    setNotes('');
    setEnergyLevel('medium');
    setEstimatedMinutes(15);
    setMicroSteps([]);
    setBlockers([]);
    setFrictionBuster('');
  };

  return (
    <div className="max-w-6xl mx-auto py-6 px-4">
      
      {/* Top Banner */}
      <div className="mb-6 p-5 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <h1 className="text-xl font-bold text-white">SMART-ify Lounge</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Phase 2 of your workflow. Transform fast brain-dumps into friction-free, unblocked missions with clear definitions of done.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 border border-slate-700">
            Inbox: <b className="text-amber-400">{inboxTasks.length}</b>
          </span>
          <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 border border-slate-700">
            Ready Pool: <b className="text-emerald-400">{unblockedReadyTasks.length}</b>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Inbox List */}
        <div className="lg:col-span-4 bg-slate-900/60 border border-slate-800 rounded-3xl p-4 flex flex-col h-[650px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Unclarified Inbox ({inboxTasks.length})
            </span>
            <button
              onClick={() => {
                setSelectedTask(null);
                resetForm();
              }}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Task</span>
            </button>
          </div>

          {/* List items */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {inboxTasks.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                <CheckCircle2 className="w-10 h-10 text-emerald-500/40 mb-2" />
                <p className="text-xs font-semibold text-slate-400">Inbox is empty!</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  All dumped thoughts have been clarified into ready tasks.
                </p>
              </div>
            ) : (
              inboxTasks.map(task => {
                const isSelected = selectedTask?.id === task.id;
                return (
                  <button
                    key={task.id}
                    onClick={() => handleSelectTask(task)}
                    className={`w-full p-3.5 rounded-2xl text-left border transition ${
                      isSelected
                        ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg'
                        : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    <span className="text-sm font-semibold block truncate">
                      {task.title}
                    </span>
                    <span className="text-[11px] text-slate-500 block mt-1">
                      Dumped {new Date(task.createdAt).toLocaleDateString()}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: SMART Clarifier Form */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between">
          <div className="space-y-5">
            
            {/* Header info */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                {selectedTask ? 'Refining Task' : 'Create New SMART Mission'}
              </span>
              {selectedTask && (
                <button
                  onClick={() => {
                    deleteTask(selectedTask.id);
                    setSelectedTask(null);
                    resetForm();
                  }}
                  className="p-1.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition text-xs flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              )}
            </div>

            {/* Task Title */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Specific Task (Action Verb) *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Draft quarterly budget email to finance"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Definition of Done (DoD) */}
            <div>
              <label className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5 mb-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Definition of Done (When am I actually finished?)</span>
              </label>
              <input
                type="text"
                value={definitionOfDone}
                onChange={(e) => setDefinitionOfDone(e.target.value)}
                placeholder="e.g. Email is sent and spreadsheet link is verified"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Energy Spoon & Time Estimate */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Energy Level */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Energy Level (Spoons Required)
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setEnergyLevel('low')}
                    className={`py-2 px-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1 transition ${
                      energyLevel === 'low'
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    <BatteryLow className="w-3.5 h-3.5" />
                    <span>Low</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEnergyLevel('medium')}
                    className={`py-2 px-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1 transition ${
                      energyLevel === 'medium'
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Med</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEnergyLevel('high')}
                    className={`py-2 px-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1 transition ${
                      energyLevel === 'high'
                        ? 'bg-amber-600 text-white border-amber-500 shadow'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    <Flame className="w-3.5 h-3.5" />
                    <span>High</span>
                  </button>
                </div>
              </div>

              {/* Time Estimate */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Estimated Minutes
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[5, 15, 30, 60].map(mins => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setEstimatedMinutes(mins)}
                      className={`py-2 px-2 rounded-xl text-xs font-semibold border transition ${
                        estimatedMinutes === mins
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Friction Buster Starter Step */}
            <div>
              <label className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 mb-1">
                <Scissors className="w-3.5 h-3.5" />
                <span>Friction Buster (2-Minute Micro-Starter for activation energy)</span>
              </label>
              <input
                type="text"
                value={frictionBuster}
                onChange={(e) => setFrictionBuster(e.target.value)}
                placeholder="e.g. Just open the Google Doc and write the subject line"
                className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Micro-Steps (Deconstruction) */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Micro-Steps (Optional Breakdown)
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newStepInput}
                  onChange={(e) => setNewStepInput(e.target.value)}
                  placeholder="Add a small step (e.g. Open browser, Log in)"
                  className="flex-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddMicroStep();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddMicroStep}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700"
                >
                  + Add
                </button>
              </div>

              {microSteps.length > 0 && (
                <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                  {microSteps.map(step => (
                    <div key={step.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
                      <span>{step.title}</span>
                      <button
                        type="button"
                        onClick={() => setMicroSteps(prev => prev.filter(s => s.id !== step.id))}
                        className="text-slate-500 hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Blockers */}
            <div>
              <label className="text-xs font-semibold text-rose-400 flex items-center gap-1.5 mb-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Blockers (If present, task won&rsquo;t show up on roulette until resolved)</span>
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newBlockerInput}
                  onChange={(e) => setNewBlockerInput(e.target.value)}
                  placeholder="e.g. Waiting for reply from boss, need to buy stamps"
                  className="flex-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddBlocker();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddBlocker}
                  className="px-3 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/40 text-rose-300 text-xs font-semibold border border-rose-800"
                >
                  + Add Blocker
                </button>
              </div>

              {blockers.length > 0 && (
                <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
                  {blockers.map(b => (
                    <div key={b.id} className="flex items-center justify-between p-2 rounded-xl bg-rose-950/20 border border-rose-900/40 text-xs text-rose-200">
                      <span>🚫 {b.text}</span>
                      <button
                        type="button"
                        onClick={() => setBlockers(prev => prev.filter(item => item.id !== b.id))}
                        className="text-rose-400 hover:text-rose-200"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Bottom Save Action */}
          <div className="pt-6 border-t border-slate-800 flex items-center justify-end gap-3 mt-4">
            <button
              onClick={handleSaveAsReady}
              disabled={!title.trim()}
              className={`px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition ${
                !title.trim() ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <Dices className="w-4 h-4" />
              <span>Save & Mark Ready to Roll 🎲</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};

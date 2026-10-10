import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  CheckCircle2, 
  BatteryLow, 
  Flame, 
  Zap, 
  Clock, 
  ShieldAlert, 
  ChevronDown, 
  ChevronUp,
  RotateCcw
} from 'lucide-react';
import { useTaskContext } from '../context/TaskContext';
import { Task, EnergyLevel } from '../types/task';
import { generateId } from '../utils/storage';

export const TasksView: React.FC = () => {
  const { 
    tasks, 
    addQuickTask, 
    createOrUpdateTask, 
    deleteTask,
    restoreFromColdStorage 
  } = useTaskContext();

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [activeTab, setActiveTab] = useState<'ready' | 'blocked' | 'all' | 'done'>('ready');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  // Quick add from top input
  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const task = addQuickTask(newTaskTitle.trim());
    // Auto mark as ready so it can be rolled immediately
    createOrUpdateTask({
      id: task.id,
      title: task.title,
      status: 'ready'
    });
    setNewTaskTitle('');
  };

  const filteredTasks = tasks.filter(t => {
    if (activeTab === 'ready') return t.status === 'ready' || t.status === 'inbox';
    if (activeTab === 'blocked') return t.status === 'blocked' || t.blockers.some(b => !b.resolved);
    if (activeTab === 'done') return t.status === 'completed';
    return true; // all
  });

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

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 animate-fade-in">
      
      {/* 1. Fast Google Keep-style Input at Top */}
      <form onSubmit={handleQuickAdd} className="mb-6">
        <div className="flex gap-2 p-1.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg focus-within:border-indigo-500 transition">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Add a task... (Press Enter)"
            className="flex-1 px-3 py-2 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!newTaskTitle.trim()}
            className={`px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold shadow transition ${
              !newTaskTitle.trim() ? 'opacity-40 cursor-not-allowed' : 'hover:bg-indigo-500 active:scale-95'
            }`}
          >
            Add
          </button>
        </div>
      </form>

      {/* 2. Minimal Tabs */}
      <div className="flex items-center gap-1 mb-4 border-b border-slate-900 pb-2 text-xs">
        {[
          { id: 'ready', label: 'Ready', count: tasks.filter(t => t.status === 'ready' || t.status === 'inbox').length },
          { id: 'blocked', label: 'Blocked', count: tasks.filter(t => t.status === 'blocked').length },
          { id: 'done', label: 'Done', count: tasks.filter(t => t.status === 'completed').length },
          { id: 'all', label: 'All', count: tasks.length }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-3 py-1.5 rounded-xl font-medium transition flex items-center gap-1.5 ${
              activeTab === tab.id
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>{tab.label}</span>
            <span className="text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.2 rounded-full">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* 3. Task List */}
      <div className="space-y-2">
        {filteredTasks.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            No tasks here.
          </div>
        ) : (
          filteredTasks.map(task => {
            const isEditing = editingTaskId === task.id;
            return (
              <div
                key={task.id}
                className="rounded-2xl bg-slate-900 border border-slate-800/80 p-3.5 transition hover:border-slate-700"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <button
                      onClick={() => {
                        createOrUpdateTask({
                          id: task.id,
                          title: task.title,
                          status: task.status === 'completed' ? 'ready' : 'completed',
                          completedAt: task.status === 'completed' ? undefined : new Date().toISOString()
                        });
                      }}
                      className="text-slate-500 hover:text-emerald-400 transition shrink-0"
                    >
                      {task.status === 'completed' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-600 hover:border-emerald-400" />
                      )}
                    </button>

                    <span className={`text-sm font-medium truncate ${
                      task.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-200'
                    }`}>
                      {task.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {task.energyLevel === 'low' && (
                      <span className="text-[10px] text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-900/40">
                        Low
                      </span>
                    )}
                    {task.status === 'blocked' && (
                      <span className="text-[10px] text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded-md border border-rose-900/40">
                        Blocked
                      </span>
                    )}

                    <button
                      onClick={() => setEditingTaskId(isEditing ? null : task.id)}
                      className="p-1 rounded-lg text-slate-500 hover:text-slate-300 transition text-xs"
                      title="Edit task details"
                    >
                      {isEditing ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      onClick={() => deleteTask(task.id)}
                      className="p-1 rounded-lg text-slate-500 hover:text-rose-400 transition"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Show blockers with 1-click unblock */}
                {task.blockers && task.blockers.length > 0 && !isEditing && (
                  <div className="mt-2 pt-2 border-t border-slate-800/60 text-xs">
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

                {/* Inline Quick Editor if expanded */}
                {isEditing && (
                  <div className="mt-3 pt-3 border-t border-slate-800 text-xs space-y-2.5 animate-fade-in">
                    <div>
                      <label className="text-slate-400 block mb-1">Definition of Done (DoD)</label>
                      <input
                        type="text"
                        value={task.definitionOfDone || ''}
                        onChange={(e) => createOrUpdateTask({ id: task.id, title: task.title, definitionOfDone: e.target.value })}
                        placeholder="Finished when..."
                        className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">Energy:</span>
                      {(['low', 'medium', 'high'] as EnergyLevel[]).map(lvl => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => createOrUpdateTask({ id: task.id, title: task.title, energyLevel: lvl })}
                          className={`px-2 py-0.5 rounded-lg border text-[11px] capitalize ${
                            task.energyLevel === lvl
                              ? 'bg-indigo-600 text-white border-indigo-500'
                              : 'text-slate-400 border-slate-800 bg-slate-950'
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
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

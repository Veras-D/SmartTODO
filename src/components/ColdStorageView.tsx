import React, { useState } from 'react';
import { 
  FolderArchive, 
  RotateCcw, 
  Trash2, 
  ShieldAlert, 
  CheckCircle2, 
  Download, 
  Upload, 
  BatteryLow, 
  Flame, 
  Zap,
  Clock
} from 'lucide-react';
import { useTaskContext } from '../context/TaskContext';
import { TaskStatus } from '../types/task';

export const ColdStorageView: React.FC = () => {
  const { 
    tasks, 
    restoreFromColdStorage, 
    deleteTask, 
    createOrUpdateTask,
    importKeepNotes
  } = useTaskContext();

  const [activeFilter, setActiveFilter] = useState<'cold_storage' | 'blocked' | 'completed' | 'all'>('cold_storage');

  const filteredTasks = tasks.filter(t => {
    if (activeFilter === 'all') return true;
    return t.status === activeFilter;
  });

  // Export JSON backup
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(tasks, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `smarttodo_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import JSON backup
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          parsed.forEach(t => {
            if (t.title) {
              createOrUpdateTask(t);
            }
          });
          alert('Tasks successfully imported!');
        }
      } catch (err) {
        alert('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const resolveBlocker = (taskId: string, blockerId: string) => {
    const target = tasks.find(t => t.id === taskId);
    if (!target) return;

    const updatedBlockers = target.blockers.map(b => b.id === blockerId ? { ...b, resolved: true } : b);
    const hasUnresolved = updatedBlockers.some(b => !b.resolved);

    createOrUpdateTask({
      ...target,
      blockers: updatedBlockers,
      status: hasUnresolved ? 'blocked' : 'ready'
    });
  };

  return (
    <div className="max-w-5xl mx-auto py-6 px-4">
      
      {/* Header */}
      <div className="mb-6 p-5 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FolderArchive className="w-5 h-5 text-indigo-400" />
            <h1 className="text-xl font-bold text-white">Archive & Task Vault</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Review Cold Storage, unblock pending tasks, or export offline backups.
          </p>
        </div>

        {/* Backup / Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>

          <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span>Import JSON</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportJSON}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {[
          { id: 'cold_storage', label: 'Cold Storage / Frozen', count: tasks.filter(t => t.status === 'cold_storage').length },
          { id: 'blocked', label: 'Blocked Tasks', count: tasks.filter(t => t.status === 'blocked').length },
          { id: 'completed', label: 'Completed Wins', count: tasks.filter(t => t.status === 'completed').length },
          { id: 'all', label: 'All Tasks', count: tasks.length }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id as typeof activeFilter)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-semibold transition ${
              activeFilter === tab.id
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <span>{tab.label}</span>
            <span className="px-1.5 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-300">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/40 border border-slate-800/80 rounded-3xl text-slate-500">
            <FolderArchive className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-semibold text-slate-400">No tasks in this category</p>
          </div>
        ) : (
          filteredTasks.map(task => (
            <div
              key={task.id}
              className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-slate-700 transition"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    task.status === 'completed'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : task.status === 'blocked'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : task.status === 'cold_storage'
                      ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {task.status}
                  </span>

                  {task.energyLevel === 'low' && (
                    <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
                      <BatteryLow className="w-3 h-3" /> Low Spoon
                    </span>
                  )}
                  {task.energyLevel === 'high' && (
                    <span className="text-[10px] font-semibold text-amber-400 flex items-center gap-1">
                      <Flame className="w-3 h-3" /> Deep Focus
                    </span>
                  )}

                  <span className="text-[10px] text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> ~{task.estimatedMinutes}m
                  </span>
                </div>

                <h3 className={`text-base font-bold text-white ${task.status === 'completed' ? 'line-through text-slate-400' : ''}`}>
                  {task.title}
                </h3>

                {task.definitionOfDone && (
                  <p className="text-xs text-slate-400 mt-1">
                    <b>DoD:</b> {task.definitionOfDone}
                  </p>
                )}

                {/* Show blockers with 1-click resolve */}
                {task.blockers && task.blockers.length > 0 && (
                  <div className="mt-2.5 space-y-1">
                    {task.blockers.map(b => (
                      <div key={b.id} className="flex items-center gap-2 text-xs">
                        <span className={b.resolved ? 'line-through text-slate-500' : 'text-rose-400 font-medium'}>
                          🚫 {b.text}
                        </span>
                        {!b.resolved && (
                          <button
                            onClick={() => resolveBlocker(task.id, b.id)}
                            className="px-2 py-0.5 rounded-lg bg-emerald-950/40 text-emerald-300 border border-emerald-800/60 text-[10px] font-semibold hover:bg-emerald-900/40"
                          >
                            Mark Unblocked ✓
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 self-end sm:self-center">
                {task.status === 'cold_storage' && (
                  <button
                    onClick={() => restoreFromColdStorage(task.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Revive to Ready</span>
                  </button>
                )}

                <button
                  onClick={() => deleteTask(task.id)}
                  title="Permanently Delete"
                  className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};

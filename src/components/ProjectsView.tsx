import React, { useState, useEffect, useRef } from 'react';
import { 
  FolderKanban, 
  Plus, 
  Play, 
  ArrowUp, 
  ArrowDown, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  Link2, 
  Unlink, 
  Sparkles, 
  Clock, 
  Inbox, 
  Dices,
  Check,
  ChevronDown,
  X
} from 'lucide-react';
import { useTaskContext } from '../context/TaskContext';
import { Project, Task } from '../types/task';

export const PROJECT_COLOR_KEYS = ['indigo', 'emerald', 'sky', 'amber', 'rose', 'purple', 'cyan'] as const;
export type ProjectColor = typeof PROJECT_COLOR_KEYS[number];

export const PROJECT_COLORS: Record<ProjectColor, { bg: string; text: string; border: string; dot: string; glow: string }> = {
  indigo: { bg: 'bg-indigo-950/40', text: 'text-indigo-300', border: 'border-indigo-800/50', dot: 'bg-indigo-400', glow: 'shadow-indigo-500/10' },
  emerald: { bg: 'bg-emerald-950/40', text: 'text-emerald-300', border: 'border-emerald-800/50', dot: 'bg-emerald-400', glow: 'shadow-emerald-500/10' },
  sky: { bg: 'bg-sky-950/40', text: 'text-sky-300', border: 'border-sky-800/50', dot: 'bg-sky-400', glow: 'shadow-sky-500/10' },
  amber: { bg: 'bg-amber-950/40', text: 'text-amber-300', border: 'border-amber-800/50', dot: 'bg-amber-400', glow: 'shadow-amber-500/10' },
  rose: { bg: 'bg-rose-950/40', text: 'text-rose-300', border: 'border-rose-800/50', dot: 'bg-rose-400', glow: 'shadow-rose-500/10' },
  purple: { bg: 'bg-purple-950/40', text: 'text-purple-300', border: 'border-purple-800/50', dot: 'bg-purple-400', glow: 'shadow-purple-500/10' },
  cyan: { bg: 'bg-cyan-950/40', text: 'text-cyan-300', border: 'border-cyan-800/50', dot: 'bg-cyan-400', glow: 'shadow-cyan-500/10' }
};

interface ProjectsViewProps {
  onSelectTaskForFocus?: () => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({ onSelectTaskForFocus }) => {
  const {
    projects,
    tasks,
    createProject,
    updateProject,
    deleteProject,
    reorderProjectTasks,
    addTaskToProject,
    removeTaskFromProject,
    createAndAddTaskToProject,
    startTaskDirectly
  } = useTaskContext();

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Form fields
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formColor, setFormColor] = useState<ProjectColor>('indigo');

  // Task creation inside active project
  const [newTaskTitle, setNewTaskTitle] = useState('');
  
  // Custom dropdown for linking existing tasks
  const [isLinkDropdownOpen, setIsLinkDropdownOpen] = useState(false);
  const [selectedTaskIdToLink, setSelectedTaskIdToLink] = useState('');
  const linkDropdownRef = useRef<HTMLDivElement>(null);

  const titleInputRef = useRef<HTMLInputElement>(null);

  // Auto-select first project if none selected
  useEffect(() => {
    if (projects.length > 0) {
      if (!selectedProjectId || !projects.some(p => p.id === selectedProjectId)) {
        setSelectedProjectId(projects[0].id);
        setIsCreatingNew(false);
      }
    } else {
      setSelectedProjectId(null);
    }
  }, [projects, selectedProjectId]);

  // Focus title input when opening form
  useEffect(() => {
    if (isCreatingNew || isEditing) {
      setTimeout(() => titleInputRef.current?.focus(), 50);
    }
  }, [isCreatingNew, isEditing]);

  // Close custom link dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (linkDropdownRef.current && !linkDropdownRef.current.contains(e.target as HTMLElement)) {
        setIsLinkDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const activeProject = projects.find(p => p.id === selectedProjectId) || null;

  // Resolve tasks in project according to the project's taskIds order
  const projectTasks: Task[] = activeProject
    ? activeProject.taskIds
        .map(id => tasks.find(t => t.id === id))
        .filter((t): t is Task => !!t)
    : [];

  // Available tasks to link (tasks not in this project)
  const availableTasksToLink = activeProject
    ? tasks.filter(t => !activeProject.taskIds.includes(t.id) && t.status !== 'completed' && t.status !== 'cold_storage')
    : [];

  const completedCount = projectTasks.filter(t => t.status === 'completed').length;
  const progressPercent = projectTasks.length > 0 ? Math.round((completedCount / projectTasks.length) * 100) : 0;

  // Handle Save (Create or Update Project)
  const handleSaveProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    if (isEditing && activeProject) {
      updateProject(activeProject.id, {
        title: formTitle.trim(),
        description: formDescription.trim(),
        color: formColor
      });
      setIsEditing(false);
    } else {
      const created = createProject({
        title: formTitle.trim(),
        description: formDescription.trim(),
        color: formColor
      });
      setSelectedProjectId(created.id);
      setIsCreatingNew(false);
    }

    setFormTitle('');
    setFormDescription('');
  };

  const startEditingCurrent = () => {
    if (!activeProject) return;
    setFormTitle(activeProject.title);
    setFormDescription(activeProject.description || '');
    setFormColor((activeProject.color as ProjectColor) || 'indigo');
    setIsEditing(true);
    setIsCreatingNew(false);
  };

  const startCreatingNew = () => {
    setFormTitle('');
    setFormDescription('');
    setFormColor('indigo');
    setIsCreatingNew(true);
    setIsEditing(false);
  };

  // Reordering tasks in project
  const handleMoveTask = (index: number, direction: 'up' | 'down') => {
    if (!activeProject) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= activeProject.taskIds.length) return;

    const newTaskIds = [...activeProject.taskIds];
    const temp = newTaskIds[index];
    newTaskIds[index] = newTaskIds[targetIndex];
    newTaskIds[targetIndex] = temp;

    reorderProjectTasks(activeProject.id, newTaskIds);
  };

  // Add new task into project
  const handleAddNewTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !activeProject) return;
    createAndAddTaskToProject(activeProject.id, newTaskTitle.trim());
    setNewTaskTitle('');
  };

  // Link selected existing task to project
  const handleLinkTask = (taskId: string) => {
    if (!taskId || !activeProject) return;
    addTaskToProject(activeProject.id, taskId);
    setSelectedTaskIdToLink('');
    setIsLinkDropdownOpen(false);
  };

  // Start task directly in Focus mode
  const handleStartTask = (taskId: string) => {
    startTaskDirectly(taskId);
    if (onSelectTaskForFocus) {
      onSelectTaskForFocus();
    }
  };

  // Delete project
  const handleDeleteProject = () => {
    if (!activeProject) return;
    if (window.confirm(`Delete project "${activeProject.title}"? Tasks will not be deleted, only unlinked.`)) {
      deleteProject(activeProject.id);
      setSelectedProjectId(null);
      setIsEditing(false);
    }
  };

  const projectColorStyle = activeProject
    ? PROJECT_COLORS[(activeProject.color as ProjectColor) || 'indigo']
    : PROJECT_COLORS.indigo;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 animate-fade-in">
      
      {/* 1. Header Bar */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-900">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shadow-inner">
            <FolderKanban className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-white tracking-tight">Projects</h1>
              <kbd className="text-[10px] bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded border border-slate-800 font-mono">
                P
              </kbd>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Organize related tasks into focused, ordered goals
            </p>
          </div>
        </div>

        {!isCreatingNew && (
          <button
            onClick={startCreatingNew}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Project</span>
          </button>
        )}
      </div>

      {/* 2. Create / Edit Project Form Card */}
      {(isCreatingNew || isEditing) && (
        <form onSubmit={handleSaveProject} className="mb-6 p-5 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 animate-fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-indigo-400" />
              <span>{isEditing ? 'Edit Project Details' : 'Create New Project'}</span>
            </h2>
            <button
              type="button"
              onClick={() => {
                setIsCreatingNew(false);
                setIsEditing(false);
              }}
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Project Title *
            </label>
            <input
              ref={titleInputRef}
              type="text"
              required
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="e.g. Website Redesign, Tax Return 2026, Learn French..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Definition of Done / Goal Description (Optional)
            </label>
            <textarea
              rows={2}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="What does success look like when this project is finished?"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Badge Color
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {PROJECT_COLOR_KEYS.map(c => {
                const style = PROJECT_COLORS[c];
                const isSelected = formColor === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setFormColor(c)}
                    className={`w-8 h-8 rounded-xl ${style.dot} transition flex items-center justify-center border ${
                      isSelected ? 'scale-110 border-white shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                    title={c}
                  >
                    {isSelected && <Check className="w-4 h-4 text-slate-950 font-bold" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              disabled={!formTitle.trim()}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition active:scale-95 disabled:opacity-40"
            >
              {isEditing ? 'Save Changes' : 'Create Project'}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsCreatingNew(false);
                setIsEditing(false);
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* 3. Empty State when 0 Projects */}
      {projects.length === 0 && !isCreatingNew && (
        <div className="p-12 text-center rounded-3xl bg-slate-900/50 border border-slate-800/80 shadow-lg">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mx-auto mb-4">
            <FolderKanban className="w-8 h-8" />
          </div>
          <h2 className="text-base font-bold text-white mb-1">No projects yet</h2>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-5">
            Projects help you bundle multiple related tasks together and execute them in a specific priority order.
          </p>
          <button
            onClick={startCreatingNew}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow transition active:scale-95 inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Your First Project</span>
          </button>
        </div>
      )}

      {/* 4. Projects Selector Bar (when projects exist) */}
      {projects.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {projects.map(p => {
              const pTasks = p.taskIds.map(id => tasks.find(t => t.id === id)).filter(Boolean);
              const pDone = pTasks.filter(t => t?.status === 'completed').length;
              const pColor = PROJECT_COLORS[(p.color as ProjectColor) || 'indigo'];
              const isSelected = p.id === selectedProjectId;

              return (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedProjectId(p.id);
                    setIsCreatingNew(false);
                    setIsEditing(false);
                  }}
                  className={`px-3.5 py-2 rounded-2xl transition flex items-center gap-2 text-xs font-medium border shrink-0 ${
                    isSelected
                      ? `${pColor.bg} ${pColor.text} ${pColor.border} font-bold shadow-md`
                      : 'bg-slate-900/80 text-slate-400 border-slate-800/80 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${pColor.dot} shrink-0`} />
                  <span className="truncate max-w-[160px]">{p.title}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-950/80 text-slate-400 font-mono">
                    {pDone}/{p.taskIds.length}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Active Project Workspace */}
      {activeProject && !isCreatingNew && (
        <div className="space-y-6">
          
          {/* Active Project Banner */}
          <div className={`p-5 sm:p-6 rounded-3xl ${projectColorStyle.bg} border ${projectColorStyle.border} shadow-lg relative`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 mb-1">
                  <span className={`w-3 h-3 rounded-full ${projectColorStyle.dot} shrink-0`} />
                  <h2 className="text-xl font-bold text-white truncate">
                    {activeProject.title}
                  </h2>
                </div>

                {activeProject.description && (
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                    {activeProject.description}
                  </p>
                )}
              </div>

              {/* Edit / Delete Project Actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={startEditingCurrent}
                  className="p-2 rounded-xl bg-slate-900/60 text-slate-300 hover:text-white border border-slate-700/60 hover:bg-slate-800 transition"
                  title="Edit Project Details"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleDeleteProject}
                  className="p-2 rounded-xl bg-slate-900/60 text-slate-400 hover:text-rose-400 border border-slate-700/60 hover:bg-rose-950/40 transition"
                  title="Delete Project"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            {projectTasks.length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-800/60">
                <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                  <span className="text-slate-400">
                    Project Completion: <b className="text-white">{completedCount}</b> of <b>{projectTasks.length}</b> tasks done
                  </span>
                  <span className={`font-bold ${projectColorStyle.text}`}>{progressPercent}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-950/80 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${projectColorStyle.dot}`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* 6. Tasks in Execution Order */}
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Ordered Tasks ({projectTasks.length})</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Tasks are listed in execution order. Use ▲ and ▼ to reorder.
                </p>
              </div>
            </div>

            {projectTasks.length === 0 ? (
              <div className="p-10 text-center text-slate-500 text-xs bg-slate-900/40 rounded-3xl border border-slate-800/60 border-dashed">
                No tasks linked to this project yet. Create a new task or link an existing one below!
              </div>
            ) : (
              <div className="space-y-2">
                {projectTasks.map((task, index) => {
                  const isDone = task.status === 'completed';
                  const isFirst = index === 0;
                  const isLast = index === projectTasks.length - 1;

                  return (
                    <div
                      key={task.id}
                      className={`flex items-center justify-between gap-3 p-3 rounded-2xl border transition ${
                        isDone
                          ? 'bg-slate-900/30 border-slate-900 opacity-60'
                          : 'bg-slate-900 border-slate-800/80 hover:border-slate-700 shadow-sm'
                      }`}
                    >
                      {/* Order Position & Up/Down Arrows */}
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="w-6 text-center text-xs font-mono font-bold text-slate-500">
                          #{index + 1}
                        </span>

                        <div className="flex flex-col gap-0.5">
                          <button
                            type="button"
                            disabled={isFirst}
                            onClick={() => handleMoveTask(index, 'up')}
                            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-20 disabled:hover:bg-transparent transition"
                            title="Move up in order"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={isLast}
                            onClick={() => handleMoveTask(index, 'down')}
                            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-20 disabled:hover:bg-transparent transition"
                            title="Move down in order"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Task Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          {task.status === 'inbox' && (
                            <span className="text-[10px] font-bold text-amber-300 bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-900/40">
                              Inbox
                            </span>
                          )}
                          {task.status === 'ready' && (
                            <span className="text-[10px] font-bold text-indigo-300 bg-indigo-950/40 px-2 py-0.5 rounded-md border border-indigo-900/40">
                              Ready
                            </span>
                          )}
                          {task.status === 'in_progress' && (
                            <span className="text-[10px] font-bold text-sky-300 bg-sky-950/40 px-2 py-0.5 rounded-md border border-sky-800/40">
                              In Progress
                            </span>
                          )}
                          {task.status === 'blocked' && (
                            <span className="text-[10px] font-bold text-rose-300 bg-rose-950/40 px-2 py-0.5 rounded-md border border-rose-900/40">
                              Blocked
                            </span>
                          )}
                          {task.status === 'completed' && (
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-900/40">
                              Done
                            </span>
                          )}

                          {task.estimatedMinutes && (
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-500" />
                              <span>{task.estimatedMinutes}m</span>
                            </span>
                          )}
                          {task.gtdContext && (
                            <span className="text-[10px] text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded">
                              {task.gtdContext}
                            </span>
                          )}
                        </div>

                        <h4 className={`text-sm truncate ${isDone ? 'line-through text-slate-500' : 'text-slate-100 font-semibold'}`}>
                          {task.title}
                        </h4>
                      </div>

                      {/* Actions: Start & Unlink */}
                      <div className="flex items-center gap-2 shrink-0">
                        {!isDone && (
                          <button
                            type="button"
                            onClick={() => handleStartTask(task.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition active:scale-95"
                            title="Start this task now in Focus Mode"
                          >
                            <Play className="w-3 h-3 fill-white" />
                            <span>Focus</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => removeTaskFromProject(activeProject.id, task.id)}
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition"
                          title="Unlink task from this project"
                        >
                          <Unlink className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 7. Bottom Tools: Add New Task & Link Existing Task */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-900">
            
            {/* 7A: Create New Task in this Project */}
            <form onSubmit={handleAddNewTask} className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-md">
              <span className="text-xs font-bold text-white block mb-2 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-indigo-400" />
                <span>Create New Task</span>
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Task title... (Press Enter)"
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                />
                <button
                  type="submit"
                  disabled={!newTaskTitle.trim()}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold shadow transition active:scale-95"
                >
                  Add
                </button>
              </div>
            </form>

            {/* 7B: Link Existing Task to this Project */}
            <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-md relative" ref={linkDropdownRef}>
              <span className="text-xs font-bold text-white block mb-2 flex items-center gap-1.5">
                <Link2 className="w-4 h-4 text-sky-400" />
                <span>Link Existing Task</span>
              </span>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsLinkDropdownOpen(prev => !prev)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-left text-slate-300 hover:border-slate-700 transition"
                >
                  <span className="truncate">
                    {availableTasksToLink.length > 0
                      ? 'Select an existing task to link...'
                      : 'No other unlinked tasks available'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
                </button>

                {isLinkDropdownOpen && availableTasksToLink.length > 0 && (
                  <div className="absolute left-0 right-0 bottom-full mb-1 max-h-56 overflow-y-auto rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl py-1 z-30 animate-fade-in">
                    {availableTasksToLink.map(task => (
                      <button
                        key={task.id}
                        type="button"
                        onClick={() => handleLinkTask(task.id)}
                        className="w-full text-left px-3 py-2 hover:bg-slate-800/80 transition flex items-center justify-between text-xs text-slate-200"
                      >
                        <span className="truncate flex-1 min-w-0 mr-2">{task.title}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-medium shrink-0 bg-slate-950 text-slate-400 border border-slate-800">
                          {task.status}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};

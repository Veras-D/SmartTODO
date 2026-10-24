import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
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
  Check
} from 'lucide-react';
import { useTaskContext } from '../context/TaskContext';
import { Project, Task } from '../types/task';

export const PROJECT_COLOR_KEYS = ['indigo', 'emerald', 'sky', 'amber', 'rose', 'purple', 'cyan'] as const;
export type ProjectColor = typeof PROJECT_COLOR_KEYS[number];

export const PROJECT_COLORS: Record<ProjectColor, { bg: string; text: string; border: string; dot: string; lightBg: string }> = {
  indigo: { bg: 'bg-indigo-950/40', text: 'text-indigo-300', border: 'border-indigo-800/50', dot: 'bg-indigo-400', lightBg: 'bg-indigo-500/20' },
  emerald: { bg: 'bg-emerald-950/40', text: 'text-emerald-300', border: 'border-emerald-800/50', dot: 'bg-emerald-400', lightBg: 'bg-emerald-500/20' },
  sky: { bg: 'bg-sky-950/40', text: 'text-sky-300', border: 'border-sky-800/50', dot: 'bg-sky-400', lightBg: 'bg-sky-500/20' },
  amber: { bg: 'bg-amber-950/40', text: 'text-amber-300', border: 'border-amber-800/50', dot: 'bg-amber-400', lightBg: 'bg-amber-500/20' },
  rose: { bg: 'bg-rose-950/40', text: 'text-rose-300', border: 'border-rose-800/50', dot: 'bg-rose-400', lightBg: 'bg-rose-500/20' },
  purple: { bg: 'bg-purple-950/40', text: 'text-purple-300', border: 'border-purple-800/50', dot: 'bg-purple-400', lightBg: 'bg-purple-500/20' },
  cyan: { bg: 'bg-cyan-950/40', text: 'text-cyan-300', border: 'border-cyan-800/50', dot: 'bg-cyan-400', lightBg: 'bg-cyan-500/20' }
};

interface ProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTaskForFocus?: () => void;
}

export const ProjectsModal: React.FC<ProjectsModalProps> = ({
  isOpen,
  onClose,
  onSelectTaskForFocus
}) => {
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

  // New / Edit Project form fields
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formColor, setFormColor] = useState<ProjectColor>('indigo');

  // Task creation inside active project
  const [newTaskTitle, setNewTaskTitle] = useState('');
  // Task linking dropdown
  const [selectedTaskIdToLink, setSelectedTaskIdToLink] = useState('');

  const titleInputRef = useRef<HTMLInputElement>(null);

  // Auto-select first project on open if none selected
  useEffect(() => {
    if (isOpen) {
      if (projects.length > 0 && (!selectedProjectId || !projects.some(p => p.id === selectedProjectId))) {
        setSelectedProjectId(projects[0].id);
        setIsCreatingNew(false);
      } else if (projects.length === 0) {
        setIsCreatingNew(true);
      }
    }
  }, [isOpen, projects, selectedProjectId]);

  // Focus title input when creating/editing
  useEffect(() => {
    if (isCreatingNew || isEditing) {
      setTimeout(() => titleInputRef.current?.focus(), 50);
    }
  }, [isCreatingNew, isEditing]);

  if (!isOpen) return null;

  const activeProject = projects.find(p => p.id === selectedProjectId) || null;

  // Resolve ordered tasks belonging to this project
  const projectTasks: Task[] = activeProject
    ? activeProject.taskIds
        .map(id => tasks.find(t => t.id === id))
        .filter((t): t is Task => !!t)
    : [];

  // Tasks available to be linked (not already in this project)
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

  // Link existing task to project
  const handleLinkTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskIdToLink || !activeProject) return;
    addTaskToProject(activeProject.id, selectedTaskIdToLink);
    setSelectedTaskIdToLink('');
  };

  // Start task directly in Focus mode
  const handleStartTask = (taskId: string) => {
    startTaskDirectly(taskId);
    if (onSelectTaskForFocus) {
      onSelectTaskForFocus();
    }
    onClose();
  };

  // Delete project
  const handleDeleteProject = () => {
    if (!activeProject) return;
    if (window.confirm(`Delete project "${activeProject.title}"? (Tasks will remain, but will be unlinked)`)) {
      deleteProject(activeProject.id);
      setSelectedProjectId(null);
      setIsEditing(false);
    }
  };

  const projectColorStyle = activeProject
    ? PROJECT_COLORS[(activeProject.color as ProjectColor) || 'indigo']
    : PROJECT_COLORS.indigo;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden relative">
        
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">Projects</h2>
                <kbd className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700 font-mono">
                  P
                </kbd>
              </div>
              <p className="text-xs text-slate-400">
                Group tasks into ordered goal-driven projects
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isCreatingNew && (
              <button
                onClick={startCreatingNew}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Project</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 flex flex-col sm:flex-row overflow-hidden mt-4 gap-4">
          
          {/* Left Column: Projects Sidebar list */}
          <div className="sm:w-60 shrink-0 flex flex-col border-b sm:border-b-0 sm:border-r border-slate-800/80 pr-0 sm:pr-4 pb-3 sm:pb-0 overflow-y-auto max-h-40 sm:max-h-none">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 block px-1">
              All Projects ({projects.length})
            </span>

            {projects.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 bg-slate-950/40 rounded-2xl border border-slate-800/40">
                No projects yet. Create one!
              </div>
            ) : (
              <div className="space-y-1.5">
                {projects.map(p => {
                  const pTasks = p.taskIds.map(id => tasks.find(t => t.id === id)).filter(Boolean);
                  const pDone = pTasks.filter(t => t?.status === 'completed').length;
                  const pColor = PROJECT_COLORS[(p.color as ProjectColor) || 'indigo'];
                  const isSelected = p.id === selectedProjectId && !isCreatingNew;

                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        setSelectedProjectId(p.id);
                        setIsCreatingNew(false);
                        setIsEditing(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl transition flex items-center justify-between text-xs font-medium border ${
                        isSelected
                          ? `${pColor.bg} ${pColor.text} ${pColor.border} font-semibold shadow-sm`
                          : 'bg-slate-950/40 text-slate-400 border-slate-800/40 hover:bg-slate-800/50 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                        <span className={`w-2 h-2 rounded-full ${pColor.dot} shrink-0`} />
                        <span className="truncate">{p.title}</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-900 text-slate-400 shrink-0 ml-1 font-mono">
                        {pDone}/{p.taskIds.length}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Project Details & Ordered Tasks */}
          <div className="flex-1 flex flex-col overflow-y-auto pl-0 sm:pl-1">
            
            {/* Mode 1: Create New or Edit Project Form */}
            {(isCreatingNew || isEditing) ? (
              <form onSubmit={handleSaveProject} className="p-4 sm:p-5 rounded-2xl bg-slate-950/50 border border-slate-800 space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <FolderKanban className="w-4 h-4 text-indigo-400" />
                    <span>{isEditing ? 'Edit Project' : 'Create New Project'}</span>
                  </h3>
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="text-xs text-slate-400 hover:text-slate-200"
                    >
                      Cancel
                    </button>
                  )}
                </div>

                {/* Title */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Project Title *
                  </label>
                  <input
                    ref={titleInputRef}
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Launch Marketing Campaign, Reorganize Garage..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Goal / Outcome Description (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="What is the definition of success for this project?"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Color Scheme Picker */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Project Color Badge
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
                          className={`w-7 h-7 rounded-xl ${style.dot} transition flex items-center justify-center border ${
                            isSelected ? 'scale-110 border-white shadow-md' : 'border-transparent opacity-70 hover:opacity-100'
                          }`}
                          title={c}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 text-slate-950 font-bold" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={!formTitle.trim()}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow transition active:scale-95 disabled:opacity-50"
                  >
                    {isEditing ? 'Save Changes' : 'Create Project'}
                  </button>

                  {isCreatingNew && projects.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsCreatingNew(false)}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            ) : activeProject ? (
              /* Mode 2: View Active Project, its tasks & ordering controls */
              <div className="space-y-4">
                
                {/* Project Header Banner */}
                <div className={`p-4 rounded-2xl ${projectColorStyle.bg} border ${projectColorStyle.border} shadow-sm`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${projectColorStyle.dot}`} />
                        <h3 className="text-base font-bold text-white truncate">
                          {activeProject.title}
                        </h3>
                      </div>
                      {activeProject.description && (
                        <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                          {activeProject.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={startEditingCurrent}
                        className="p-1.5 rounded-lg bg-slate-900/60 text-slate-300 hover:text-white border border-slate-700/60 hover:bg-slate-800 transition"
                        title="Edit Project"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={handleDeleteProject}
                        className="p-1.5 rounded-lg bg-slate-900/60 text-slate-400 hover:text-rose-400 border border-slate-700/60 hover:bg-rose-950/30 transition"
                        title="Delete Project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {projectTasks.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-800/60">
                      <div className="flex items-center justify-between text-[11px] mb-1 font-medium">
                        <span className="text-slate-400">
                          Progress: <b className="text-white">{completedCount}</b> of <b>{projectTasks.length}</b> done
                        </span>
                        <span className={projectColorStyle.text}>{progressPercent}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${projectColorStyle.dot}`}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Ordered Tasks Section */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <span>Tasks in Execution Order ({projectTasks.length})</span>
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Use ▲/▼ arrows to prioritize
                    </span>
                  </div>

                  {projectTasks.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs bg-slate-950/40 rounded-2xl border border-slate-850 border-dashed">
                      No tasks in this project yet. Add a new task below or link existing ones!
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {projectTasks.map((task, index) => {
                        const isDone = task.status === 'completed';
                        const isFirst = index === 0;
                        const isLast = index === projectTasks.length - 1;

                        return (
                          <div
                            key={task.id}
                            className={`flex items-center justify-between gap-2 p-2.5 rounded-xl border transition ${
                              isDone
                                ? 'bg-slate-950/30 border-slate-900 opacity-60'
                                : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700 shadow-sm'
                            }`}
                          >
                            {/* Order Number & Reorder Up/Down Controls */}
                            <div className="flex items-center gap-1 shrink-0">
                              <span className="w-5 text-center text-[10px] font-mono font-bold text-slate-500">
                                #{index + 1}
                              </span>

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

                            {/* Task Info */}
                            <div className="flex-1 min-w-0 flex items-center gap-2">
                              {/* Status Badge */}
                              {task.status === 'inbox' && (
                                <span className="text-[9px] font-bold text-amber-300 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-900/40">
                                  Inbox
                                </span>
                              )}
                              {task.status === 'ready' && (
                                <span className="text-[9px] font-bold text-indigo-300 bg-indigo-950/40 px-1.5 py-0.5 rounded border border-indigo-900/40">
                                  Ready
                                </span>
                              )}
                              {task.status === 'in_progress' && (
                                <span className="text-[9px] font-bold text-sky-300 bg-sky-950/40 px-1.5 py-0.5 rounded border border-sky-800/40">
                                  In Progress
                                </span>
                              )}
                              {task.status === 'blocked' && (
                                <span className="text-[9px] font-bold text-rose-300 bg-rose-950/40 px-1.5 py-0.5 rounded border border-rose-900/40">
                                  Blocked
                                </span>
                              )}
                              {task.status === 'completed' && (
                                <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-900/40">
                                  Done
                                </span>
                              )}

                              <span className={`text-xs truncate ${isDone ? 'line-through text-slate-500' : 'text-slate-100 font-medium'}`}>
                                {task.title}
                              </span>
                            </div>

                            {/* Actions: Start & Unlink */}
                            <div className="flex items-center gap-1 shrink-0">
                              {!isDone && (
                                <button
                                  type="button"
                                  onClick={() => handleStartTask(task.id)}
                                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold transition active:scale-95 shadow-sm"
                                  title="Start focusing on this task now"
                                >
                                  <Play className="w-3 h-3 fill-white" />
                                  <span className="hidden sm:inline">Focus</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => removeTaskFromProject(activeProject.id, task.id)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition"
                                title="Unlink task from this project"
                              >
                                <Unlink className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Add / Link Tasks Bottom Tools */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
                  
                  {/* 1. Add New Task to Project */}
                  <form onSubmit={handleAddNewTask} className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/70">
                    <span className="text-[11px] font-semibold text-slate-300 block mb-1.5 flex items-center gap-1">
                      <Plus className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Create New Task in Project</span>
                    </span>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        placeholder="Task name... (Enter)"
                        className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                      <button
                        type="submit"
                        disabled={!newTaskTitle.trim()}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold shadow transition"
                      >
                        Add
                      </button>
                    </div>
                  </form>

                  {/* 2. Link Existing Task */}
                  <form onSubmit={handleLinkTask} className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/70">
                    <span className="text-[11px] font-semibold text-slate-300 block mb-1.5 flex items-center gap-1">
                      <Link2 className="w-3.5 h-3.5 text-sky-400" />
                      <span>Link Existing Task</span>
                    </span>
                    <div className="flex gap-1.5">
                      <select
                        value={selectedTaskIdToLink}
                        onChange={(e) => setSelectedTaskIdToLink(e.target.value)}
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 text-xs text-white focus:outline-none focus:border-sky-500 truncate"
                      >
                        <option value="">Select task to link...</option>
                        {availableTasksToLink.map(t => (
                          <option key={t.id} value={t.id}>
                            [{t.status}] {t.title}
                          </option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        disabled={!selectedTaskIdToLink}
                        className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white text-xs font-semibold shadow transition"
                      >
                        Link
                      </button>
                    </div>
                  </form>

                </div>

              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                <FolderKanban className="w-10 h-10 text-slate-600 mb-2" />
                <p className="text-sm font-semibold text-slate-300">No project selected</p>
                <p className="text-xs text-slate-500 mt-1">Select a project on the left or create a new one.</p>
                <button
                  onClick={startCreatingNew}
                  className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition"
                >
                  Create New Project
                </button>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};

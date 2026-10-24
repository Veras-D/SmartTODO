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
  ChevronRight,
  ArrowLeft,
  X,
  ListTodo,
  Circle
} from 'lucide-react';
import { useTaskContext } from '../context/TaskContext';
import { Project, Task } from '../types/task';

export const PROJECT_COLOR_KEYS = ['indigo', 'emerald', 'sky', 'amber', 'rose', 'purple', 'cyan'] as const;
export type ProjectColor = typeof PROJECT_COLOR_KEYS[number];

export const PROJECT_COLORS: Record<ProjectColor, { bg: string; text: string; border: string; dot: string; ring: string }> = {
  indigo: { bg: 'bg-indigo-950/40', text: 'text-indigo-300', border: 'border-indigo-800/50', dot: 'bg-indigo-400', ring: 'ring-indigo-500/30' },
  emerald: { bg: 'bg-emerald-950/40', text: 'text-emerald-300', border: 'border-emerald-800/50', dot: 'bg-emerald-400', ring: 'ring-emerald-500/30' },
  sky: { bg: 'bg-sky-950/40', text: 'text-sky-300', border: 'border-sky-800/50', dot: 'bg-sky-400', ring: 'ring-sky-500/30' },
  amber: { bg: 'bg-amber-950/40', text: 'text-amber-300', border: 'border-amber-800/50', dot: 'bg-amber-400', ring: 'ring-amber-500/30' },
  rose: { bg: 'bg-rose-950/40', text: 'text-rose-300', border: 'border-rose-800/50', dot: 'bg-rose-400', ring: 'ring-rose-500/30' },
  purple: { bg: 'bg-purple-950/40', text: 'text-purple-300', border: 'border-purple-800/50', dot: 'bg-purple-400', ring: 'ring-purple-500/30' },
  cyan: { bg: 'bg-cyan-950/40', text: 'text-cyan-300', border: 'border-cyan-800/50', dot: 'bg-cyan-400', ring: 'ring-cyan-500/30' }
};

interface ProjectsViewProps {
  onSelectTaskForFocus?: () => void;
  projectsNavKey?: number;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({ onSelectTaskForFocus, projectsNavKey }) => {
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
    createOrUpdateTask,
    deleteTask,
    startTaskDirectly
  } = useTaskContext();

  // Navigation state: null = Projects Overview (list of projects only, no tasks); string = Project Detail (inside a project)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Form states
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formColor, setFormColor] = useState<ProjectColor>('indigo');

  // Task creation inside active project
  const [newTaskTitle, setNewTaskTitle] = useState('');
  
  // Custom dropdown for linking existing tasks
  const [isLinkDropdownOpen, setIsLinkDropdownOpen] = useState(false);
  const linkDropdownRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Reset to overview when navbar "Projects" is clicked again or tab is switched
  useEffect(() => {
    if (projectsNavKey !== undefined) {
      setSelectedProjectId(null);
      setIsCreatingNew(false);
      setIsEditing(false);
    }
  }, [projectsNavKey]);

  // Ensure selected project still exists
  useEffect(() => {
    if (selectedProjectId && !projects.some(p => p.id === selectedProjectId)) {
      setSelectedProjectId(null);
    }
  }, [projects, selectedProjectId]);

  // Focus title input when opening project form
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

  const activeProject = selectedProjectId ? (projects.find(p => p.id === selectedProjectId) || null) : null;

  // Resolve tasks in project according to the project's taskIds order
  const projectTasks: Task[] = activeProject
    ? activeProject.taskIds
        .map(id => tasks.find(t => t.id === id))
        .filter((t): t is Task => !!t)
    : [];

  // Available tasks to link (tasks not in this project, excluding cold storage)
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
      // Enter the newly created project immediately
      setSelectedProjectId(created.id);
      setIsCreatingNew(false);
    }

    setFormTitle('');
    setFormDescription('');
  };

  const startEditing = (project: Project, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFormTitle(project.title);
    setFormDescription(project.description || '');
    setFormColor((project.color as ProjectColor) || 'indigo');
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
    setIsLinkDropdownOpen(false);
  };

  // Toggle task completion directly from project
  const handleToggleTaskStatus = (task: Task) => {
    if (task.status === 'completed') {
      createOrUpdateTask({
        id: task.id,
        title: task.title,
        status: 'ready',
        completedAt: undefined
      });
    } else {
      createOrUpdateTask({
        id: task.id,
        title: task.title,
        status: 'completed',
        completedAt: new Date().toISOString()
      });
    }
  };

  // Start task directly in Focus mode
  const handleStartTask = (taskId: string) => {
    startTaskDirectly(taskId);
    if (onSelectTaskForFocus) {
      onSelectTaskForFocus();
    }
  };

  // Delete project
  const handleDeleteProject = (projectId: string, projectTitle: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (window.confirm(`Delete project "${projectTitle}"? Tasks will not be deleted, only unlinked.`)) {
      deleteProject(projectId);
      if (selectedProjectId === projectId) {
        setSelectedProjectId(null);
      }
      setIsEditing(false);
    }
  };

  // Unlink task from active project
  const handleUnlinkTask = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeProject) return;
    removeTaskFromProject(activeProject.id, taskId);
  };

  // Delete task completely
  const handleDeleteTask = (taskId: string, taskTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Delete task "${taskTitle}" permanently?`)) {
      deleteTask(taskId);
    }
  };

  // =========================================================================
  // VIEW 1: PROJECTS OVERVIEW (No project selected -> Only Projects, NO tasks)
  // =========================================================================
  if (!activeProject) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 animate-fade-in">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-900">
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
                Click a project to open its dedicated task sequence and roadmap
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

        {/* Create Project Form Card */}
        {isCreatingNew && (
          <form onSubmit={handleSaveProject} className="mb-8 p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-indigo-400" />
                <span>Create New Project</span>
              </h2>
              <button
                type="button"
                onClick={() => setIsCreatingNew(false)}
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
                placeholder="e.g. Website Launch, Reconecta Course, Tax Return 2026..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Definition of Done / Project Goal
              </label>
              <textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="What does success look like? Describe the outcome or scope..."
                rows={2}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Color Theme
              </label>
              <div className="flex items-center gap-2">
                {PROJECT_COLOR_KEYS.map(c => {
                  const style = PROJECT_COLORS[c];
                  const isSelected = formColor === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setFormColor(c)}
                      className={`w-7 h-7 rounded-xl ${style.dot} transition flex items-center justify-center ${
                        isSelected ? `ring-2 ring-white scale-110 shadow-md` : 'opacity-60 hover:opacity-100 hover:scale-105'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 text-slate-950 font-bold" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreatingNew(false)}
                className="px-3.5 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition active:scale-95"
              >
                Create Project
              </button>
            </div>
          </form>
        )}

        {/* Empty State when no projects exist */}
        {projects.length === 0 && !isCreatingNew ? (
          <div className="text-center py-16 px-6 rounded-3xl bg-slate-900/50 border border-dashed border-slate-800">
            <div className="w-14 h-14 rounded-2xl bg-indigo-950/60 border border-indigo-800/40 text-indigo-400 flex items-center justify-center mx-auto mb-4 shadow-sm">
              <FolderKanban className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">No Projects Created Yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6">
              Projects help bundle and order tasks into clear outcomes. Create your first project to get started.
            </p>
            <button
              onClick={startCreatingNew}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Project</span>
            </button>
          </div>
        ) : (
          /* Projects Grid: Clickable Project Cards (NO tasks shown on this page!) */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map(project => {
              const colorKey = (project.color as ProjectColor) || 'indigo';
              const colorStyle = PROJECT_COLORS[colorKey] || PROJECT_COLORS.indigo;
              
              // Project tasks calculation
              const pTasks = project.taskIds
                .map(id => tasks.find(t => t.id === id))
                .filter((t): t is Task => !!t);
              const totalTasksCount = pTasks.length;
              const pCompletedCount = pTasks.filter(t => t.status === 'completed').length;
              const pProgress = totalTasksCount > 0 ? Math.round((pCompletedCount / totalTasksCount) * 100) : 0;
              
              // Find the first uncompleted task for quick preview
              const nextUncompletedTask = pTasks.find(t => t.status !== 'completed');

              return (
                <div
                  key={project.id}
                  onClick={() => setSelectedProjectId(project.id)}
                  className={`p-5 rounded-3xl bg-slate-900/90 border ${colorStyle.border} hover:border-slate-600 transition-all cursor-pointer group flex flex-col justify-between hover:shadow-xl hover:-translate-y-0.5 relative overflow-hidden`}
                >
                  <div>
                    {/* Top row: Color pill, task count badge, & action buttons */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${colorStyle.dot} ring-4 ${colorStyle.bg}`} />
                        <span className="text-[11px] font-semibold text-slate-400">
                          {totalTasksCount === 0 ? '0 tasks' : `${pCompletedCount}/${totalTasksCount} done`}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition">
                        <button
                          onClick={(e) => {
                            setSelectedProjectId(project.id);
                            startEditing(project, e);
                          }}
                          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                          title="Edit project details"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteProject(project.id, project.title, e)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                          title="Delete project"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Project Title */}
                    <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition line-clamp-1">
                      {project.title}
                    </h3>

                    {/* Project Description */}
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 min-h-[2rem]">
                      {project.description || 'No description provided'}
                    </p>
                  </div>

                  {/* Bottom Stats & Progress */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80">
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden mb-2.5">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${colorStyle.dot}`}
                        style={{ width: `${pProgress}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <div className="truncate flex-1 min-w-0 mr-2 text-[11px] text-slate-400">
                        {nextUncompletedTask ? (
                          <span className="truncate flex items-center gap-1">
                            <span className="text-slate-500 font-medium">Next:</span>
                            <span className="text-slate-300 truncate">{nextUncompletedTask.title}</span>
                          </span>
                        ) : totalTasksCount > 0 ? (
                          <span className="text-emerald-400 font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> All done
                          </span>
                        ) : (
                          <span className="text-slate-500">No tasks added yet</span>
                        )}
                      </div>

                      <span className="flex items-center gap-1 font-semibold text-[11px] text-indigo-400 group-hover:translate-x-0.5 transition-transform shrink-0">
                        <span>Open</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    );
  }

  // =========================================================================
  // VIEW 2: PROJECT DETAIL (Inside a selected project -> Tasks list & adding)
  // =========================================================================
  const colorKey = (activeProject.color as ProjectColor) || 'indigo';
  const colorStyle = PROJECT_COLORS[colorKey] || PROJECT_COLORS.indigo;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 animate-fade-in">
      
      {/* 1. Back Button & Project Header */}
      <div className="mb-6">
        <button
          onClick={() => {
            setSelectedProjectId(null);
            setIsEditing(false);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-medium transition active:scale-95 mb-4 group"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-slate-400 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Projects</span>
        </button>

        {/* Edit Form if editing */}
        {isEditing ? (
          <form onSubmit={handleSaveProject} className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 mb-6 animate-fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-indigo-400" />
                <span>Edit Project Details</span>
              </h2>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
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
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Definition of Done / Project Goal
              </label>
              <textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={2}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 transition resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Color Theme
              </label>
              <div className="flex items-center gap-2">
                {PROJECT_COLOR_KEYS.map(c => {
                  const style = PROJECT_COLORS[c];
                  const isSelected = formColor === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setFormColor(c)}
                      className={`w-7 h-7 rounded-xl ${style.dot} transition flex items-center justify-center ${
                        isSelected ? `ring-2 ring-white scale-110 shadow-md` : 'opacity-60 hover:opacity-100 hover:scale-105'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 text-slate-950 font-bold" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3.5 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition active:scale-95"
              >
                Save Changes
              </button>
            </div>
          </form>
        ) : (
          /* Project Overview Card */
          <div className={`p-6 rounded-3xl bg-slate-900 border ${colorStyle.border} shadow-lg relative overflow-hidden`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className={`w-4 h-4 rounded-full ${colorStyle.dot} mt-1.5 ring-4 ${colorStyle.bg} shrink-0`} />
                <div>
                  <h1 className="text-xl font-extrabold text-white tracking-tight">
                    {activeProject.title}
                  </h1>
                  {activeProject.description && (
                    <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
                      {activeProject.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => startEditing(activeProject)}
                  className="p-2 rounded-xl bg-slate-950/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition"
                  title="Edit project"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteProject(activeProject.id, activeProject.title)}
                  className="p-2 rounded-xl bg-slate-950/80 hover:bg-slate-800 text-slate-400 hover:text-rose-400 border border-slate-800 transition"
                  title="Delete project"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Progress stats */}
            <div className="mt-6 pt-4 border-t border-slate-800/80">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-slate-300">
                  Project Progress
                </span>
                <span className="font-mono text-slate-400">
                  {completedCount} / {projectTasks.length} tasks ({progressPercent}%)
                </span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${colorStyle.dot}`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Tasks Inside This Project */}
      <div className="space-y-4 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <ListTodo className="w-4 h-4 text-indigo-400" />
              <span>Project Tasks</span>
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400">
              {projectTasks.length}
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            Ordered sequence (Use ▲ ▼ to reorder)
          </span>
        </div>

        {/* Task List */}
        {projectTasks.length === 0 ? (
          <div className="py-12 px-6 rounded-3xl bg-slate-900/40 border border-dashed border-slate-800 text-center">
            <p className="text-xs text-slate-400 mb-1">
              No tasks inside this project yet.
            </p>
            <p className="text-[11px] text-slate-500">
              Create a new task or link an existing one below to build this project's roadmap.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {projectTasks.map((task, index) => {
              const isCompleted = task.status === 'completed';
              const isInProgress = task.status === 'in_progress';

              return (
                <div
                  key={task.id}
                  className={`p-3 sm:p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 ${
                    isCompleted 
                      ? 'bg-slate-900/30 border-slate-900 text-slate-500' 
                      : isInProgress
                      ? 'bg-indigo-950/20 border-indigo-500/40 shadow-sm'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Left: Reorder Controls + Order Number + Status Checkbox */}
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    
                    {/* Move Up / Down Buttons */}
                    <div className="flex flex-col gap-0.5 shrink-0">
                      <button
                        onClick={() => handleMoveTask(index, 'up')}
                        disabled={index === 0}
                        className={`p-1 rounded text-slate-400 transition ${
                          index === 0 ? 'opacity-20 cursor-not-allowed' : 'hover:bg-slate-800 hover:text-white'
                        }`}
                        title="Move Up"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleMoveTask(index, 'down')}
                        disabled={index === projectTasks.length - 1}
                        className={`p-1 rounded text-slate-400 transition ${
                          index === projectTasks.length - 1 ? 'opacity-20 cursor-not-allowed' : 'hover:bg-slate-800 hover:text-white'
                        }`}
                        title="Move Down"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Sequential step badge */}
                    <span className="font-mono text-[11px] font-bold text-slate-500 shrink-0 w-6">
                      #{index + 1}
                    </span>

                    {/* Complete checkbox */}
                    <button
                      onClick={() => handleToggleTaskStatus(task)}
                      className={`p-1 rounded-lg transition shrink-0 ${
                        isCompleted ? 'text-emerald-400 hover:text-slate-400' : 'text-slate-500 hover:text-slate-300'
                      }`}
                      title={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
                    >
                      {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                    </button>

                    {/* Task Title & Tags */}
                    <div className="truncate flex-1 min-w-0">
                      <span className={`text-xs font-medium block truncate ${
                        isCompleted ? 'line-through text-slate-500' : 'text-slate-100'
                      }`}>
                        {task.title}
                      </span>
                      
                      <div className="flex items-center gap-2 mt-0.5">
                        {isInProgress && (
                          <span className="text-[10px] font-bold text-indigo-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                            Active in Focus
                          </span>
                        )}
                        {task.gtdContext && (
                          <span className="text-[10px] text-slate-400">
                            {task.gtdContext}
                          </span>
                        )}
                        {task.estimatedMinutes && (
                          <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" /> {task.estimatedMinutes}m
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Actions: Play Focus, Unlink, Delete */}
                  <div className="flex items-center gap-1 shrink-0">
                    {!isCompleted && (
                      <button
                        onClick={() => handleStartTask(task.id)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-medium transition active:scale-95"
                        title="Start focusing on this task now"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span className="hidden sm:inline">Focus</span>
                      </button>
                    )}

                    <button
                      onClick={(e) => handleUnlinkTask(task.id, e)}
                      className="p-1.5 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition"
                      title="Unlink from this project"
                    >
                      <Unlink className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={(e) => handleDeleteTask(task.id, task.title, e)}
                      className="p-1.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition"
                      title="Delete task permanently"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Add Tasks Section (Inside the project view) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-900">
        
        {/* Option A: Create New Task for this project */}
        <form onSubmit={handleAddNewTask} className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-white block mb-1 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-indigo-400" />
              <span>Create New Task in Project</span>
            </span>
            <p className="text-[11px] text-slate-400 mb-3">
              Appends a new task directly to this project's execution sequence.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="What needs to be done next?..."
              className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
            />
            <button
              type="submit"
              disabled={!newTaskTitle.trim()}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold shadow transition active:scale-95"
            >
              Add
            </button>
          </div>
        </form>

        {/* Option B: Link Existing Task to this project */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-sm relative flex flex-col justify-between" ref={linkDropdownRef}>
          <div>
            <span className="text-xs font-bold text-white block mb-1 flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5 text-sky-400" />
              <span>Link Existing Task</span>
            </span>
            <p className="text-[11px] text-slate-400 mb-3">
              Select an existing unlinked task to attach to this project.
            </p>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setIsLinkDropdownOpen(prev => !prev)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-left text-slate-300 hover:border-slate-700 transition"
            >
              <span className="truncate">
                {availableTasksToLink.length > 0
                  ? 'Select an existing task to link...'
                  : 'No unlinked tasks available'}
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
  );
};

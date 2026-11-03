import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  FolderKanban, 
  Plus, 
  Play, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  Link2, 
  Unlink, 
  Sparkles, 
  Clock, 
  Inbox, 
  Dices,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  X,
  ListTodo,
  Search,
  GripVertical,
  Save,
  XCircle
} from 'lucide-react';
import { useTaskContext } from '../context/TaskContext';
import { Project, Task, GTDContext, EnergyLevel, TaskImportance, RecurrenceInterval } from '../types/task';
import { AutoGrowTextarea } from './AutoGrowTextarea';
import { useTextHistory } from '../hooks/useTextHistory';

interface ProjectsViewProps {
  onSelectTaskForFocus?: () => void;
  projectsNavKey?: number;
  onOpenCreateProject?: () => void;
  directOpenProjectId?: string | null;
}

interface ConfirmDialogState {
  type: 'project' | 'task';
  id: string;
  title: string;
  message: string;
  confirmLabel: string;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({ 
  onSelectTaskForFocus, 
  projectsNavKey,
  onOpenCreateProject,
  directOpenProjectId
}) => {
  const {
    projects,
    tasks,
    createOrUpdateTask,
    createProject,
    updateProject,
    deleteProject,
    reorderProjectTasks,
    addTaskToProject,
    removeTaskFromProject,
    createAndAddTaskToProject,
    deleteTask,
    startTaskDirectly
  } = useTaskContext();

  // Navigation state: null = Projects Overview (list of projects only, no tasks); string = Project Detail (inside a project)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Custom confirmation modal state (replaces native window.confirm)
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);

  // Form states for project creation & editing
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');

  // Inline editor for a task inside the project (opened by clicking its title)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editNextAction, setEditNextAction] = useState('');
  const [editContext, setEditContext] = useState<GTDContext>('@computer');
  const [editDoD, setEditDoD] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editEnergy, setEditEnergy] = useState<EnergyLevel>('medium');
  const [editMinutes, setEditMinutes] = useState<number>(25);
  const [editRecurrence, setEditRecurrence] = useState<RecurrenceInterval>('none');
  const [editImportance, setEditImportance] = useState<TaskImportance>('medium');
  const editTitleRef = useRef<HTMLInputElement>(null);

  const openTaskEditor = (task: Task) => {
    setIsEditing(false);
    setEditingTaskId(task.id);
    setEditTitle(task.title);
    setEditNextAction(task.nextAction || '');
    setEditContext(task.gtdContext || '@computer');
    setEditDoD(task.definitionOfDone || '');
    setEditNotes(task.notes || '');
    setEditEnergy(task.energyLevel || 'medium');
    setEditMinutes(task.estimatedMinutes || 25);
    setEditRecurrence(task.recurrence || 'none');
    setEditImportance(task.importance || 'medium');
  };

  useEffect(() => {
    if (editingTaskId) {
      setTimeout(() => editTitleRef.current?.focus(), 50);
    }
  }, [editingTaskId]);

  const closeTaskEditor = () => {
    setEditingTaskId(null);
  };

  const saveTaskEditor = (task: Task) => {
    createOrUpdateTask({
      id: task.id,
      title: editTitle.trim() || task.title,
      projectId: task.projectId,
      nextAction: editNextAction.trim() || undefined,
      gtdContext: editContext,
      definitionOfDone: editDoD.trim() || undefined,
      notes: editNotes.trim() || undefined,
      energyLevel: editEnergy,
      estimatedMinutes: editMinutes,
      recurrence: editRecurrence !== 'none' ? editRecurrence : undefined,
      importance: editImportance,
      status: task.status,
      completedAt: task.completedAt,
      nextDueDate: task.nextDueDate,
      microSteps: task.microSteps,
      blockers: task.blockers,
      frictionBusterStep: task.frictionBusterStep,
      skipCount: task.skipCount,
      snoozedUntil: task.snoozedUntil,
      lastSkippedReason: task.lastSkippedReason,
      lastCompletedAt: task.lastCompletedAt,
      createdAt: task.createdAt,
      archivedAt: task.archivedAt
    });
    setEditingTaskId(null);
  };

  // Undo/redo inside the description field (controlled inputs break native undo)
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const descriptionHistory = useTextHistory(formDescription, setFormDescription, {
    inputRef: descriptionRef
  });

  // Drag and drop state for task reordering
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Unified Searchable Task Input (Search existing to link, or create new)
  const [taskQuery, setTaskQuery] = useState('');
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const taskSearchContainerRef = useRef<HTMLDivElement>(null);
  const unifiedInputRef = useRef<HTMLInputElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Reset to overview when navbar "Projects" is clicked again or tab is switched
  useEffect(() => {
    if (projectsNavKey !== undefined) {
      setSelectedProjectId(null);
      setIsCreatingNew(false);
      setIsEditing(false);
    }
  }, [projectsNavKey]);

  // Open project directly if requested (e.g. newly created via shortcut P)
  useEffect(() => {
    if (directOpenProjectId) {
      setSelectedProjectId(directOpenProjectId);
    }
  }, [directOpenProjectId]);

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

  // Close search suggestions on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (taskSearchContainerRef.current && !taskSearchContainerRef.current.contains(e.target as HTMLElement)) {
        setIsSuggestionsOpen(false);
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

  // Available tasks to link (tasks not in this project, excluding cold storage & completed)
  const availableTasksToLink = activeProject
    ? tasks.filter(t => !activeProject.taskIds.includes(t.id) && t.status !== 'completed' && t.status !== 'cold_storage')
    : [];

  // Matching existing tasks based on search query
  const matchingTasks = taskQuery.trim()
    ? availableTasksToLink.filter(t => t.title.toLowerCase().includes(taskQuery.trim().toLowerCase()))
    : availableTasksToLink;

  const exactMatchingTask = taskQuery.trim()
    ? availableTasksToLink.find(t => t.title.toLowerCase() === taskQuery.trim().toLowerCase())
    : null;

  const completedCount = projectTasks.filter(t => t.status === 'completed').length;
  const progressPercent = projectTasks.length > 0 ? Math.round((completedCount / projectTasks.length) * 100) : 0;

  // Handle Save (Create or Update Project)
  const handleSaveProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    if (isEditing && activeProject) {
      updateProject(activeProject.id, {
        title: formTitle.trim(),
        description: formDescription.trim()
      });
      setIsEditing(false);
    } else {
      const created = createProject({
        title: formTitle.trim(),
        description: formDescription.trim()
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
    setEditingTaskId(null);
    setFormTitle(project.title);
    setFormDescription(project.description || '');
    descriptionHistory.reset(project.description || '');
    setIsEditing(true);
    setIsCreatingNew(false);
  };

  const startCreatingNew = () => {
    setFormTitle('');
    setFormDescription('');
    descriptionHistory.reset('');
    setIsCreatingNew(true);
    setIsEditing(false);
  };

  // Drag and drop reordering handlers
  const handleDragStart = (index: number, e: React.DragEvent) => {
    setDraggedIndex(index);
    e.dataTransfer.setData('text/plain', String(index));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (index: number, e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDrop = (targetIndex: number, e: React.DragEvent) => {
    e.preventDefault();
    if (draggedIndex === null || !activeProject) return;
    if (draggedIndex !== targetIndex) {
      const newTaskIds = [...activeProject.taskIds];
      const [movedId] = newTaskIds.splice(draggedIndex, 1);
      newTaskIds.splice(targetIndex, 0, movedId);
      reorderProjectTasks(activeProject.id, newTaskIds);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Unified Task Action: Link existing task
  const handleSelectLinkTask = (taskId: string) => {
    if (!activeProject || !taskId) return;
    addTaskToProject(activeProject.id, taskId);
    setTaskQuery('');
    setIsSuggestionsOpen(false);
    setHighlightedIndex(-1);
  };

  // Unified Task Action: Create new task in project
  const handleCreateNewTask = (title: string) => {
    if (!activeProject || !title.trim()) return;
    createAndAddTaskToProject(activeProject.id, title.trim());
    setTaskQuery('');
    setIsSuggestionsOpen(false);
    setHighlightedIndex(-1);
  };

  // Unified Submit handler
  const handleUnifiedSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeProject || !taskQuery.trim()) return;

    // 1. If an item is highlighted via keyboard:
    if (highlightedIndex >= 0 && highlightedIndex < matchingTasks.length) {
      handleSelectLinkTask(matchingTasks[highlightedIndex].id);
      return;
    }

    // 2. If highlighted item is the "create new task" option:
    if (highlightedIndex === matchingTasks.length) {
      handleCreateNewTask(taskQuery.trim());
      return;
    }

    // 3. If there is an exact title match among existing unlinked tasks:
    if (exactMatchingTask) {
      handleSelectLinkTask(exactMatchingTask.id);
      return;
    }

    // 4. Default: If nothing matching, create as a new task!
    handleCreateNewTask(taskQuery.trim());
  };

  // Keyboard navigation for suggestions
  const totalOptions = matchingTasks.length + (taskQuery.trim() ? 1 : 0);

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsSuggestionsOpen(true);
      setHighlightedIndex(prev => (prev + 1 >= totalOptions ? 0 : prev + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIsSuggestionsOpen(true);
      setHighlightedIndex(prev => (prev - 1 < 0 ? totalOptions - 1 : prev - 1));
    } else if (e.key === 'Escape') {
      setIsSuggestionsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  // Start task directly in Focus mode
  const handleStartTask = (taskId: string) => {
    startTaskDirectly(taskId);
    if (onSelectTaskForFocus) {
      onSelectTaskForFocus();
    }
  };

  // Delete project (Shows custom dark modal instead of ugly native browser confirm)
  const handleDeleteProject = (projectId: string, projectTitle: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setConfirmDialog({
      type: 'project',
      id: projectId,
      title: `Delete "${projectTitle}"?`,
      message: 'Tasks inside this project will NOT be deleted—they will stay available in your general tasks list.',
      confirmLabel: 'Delete Project'
    });
  };

  // Unlink task from active project
  const handleUnlinkTask = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeProject) return;
    removeTaskFromProject(activeProject.id, taskId);
  };

  // Delete task completely (Shows custom dark modal)
  const handleDeleteTask = (taskId: string, taskTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDialog({
      type: 'task',
      id: taskId,
      title: 'Delete Task?',
      message: `Are you sure you want to permanently delete "${taskTitle}"? You can still undo it right after with Ctrl+Z.`,
      confirmLabel: 'Delete Task'
    });
  };

  // Execute confirmed deletion
  const handleExecuteConfirm = () => {
    if (!confirmDialog) return;
    if (confirmDialog.type === 'project') {
      deleteProject(confirmDialog.id);
      if (selectedProjectId === confirmDialog.id) {
        setSelectedProjectId(null);
      }
      setIsEditing(false);
    } else if (confirmDialog.type === 'task') {
      deleteTask(confirmDialog.id);
    }
    setConfirmDialog(null);
  };

  // Render Custom Confirmation Modal
  const renderConfirmModal = () => {
    if (!confirmDialog) return null;
    return createPortal(
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
        <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                {confirmDialog.title}
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {confirmDialog.message}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setConfirmDialog(null)}
              className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleExecuteConfirm}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20 transition active:scale-95"
            >
              {confirmDialog.confirmLabel}
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
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
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Click a project to open its dedicated task sequence and roadmap
              </p>
            </div>
          </div>

          {!isCreatingNew && (
            <button
              onClick={onOpenCreateProject || startCreatingNew}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Project</span>
              <kbd className="text-[10px] bg-indigo-700/80 text-indigo-100 px-1.5 py-0.2 rounded font-mono ml-0.5">
                P
              </kbd>
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
                Description
              </label>
              <AutoGrowTextarea
                ref={descriptionRef}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                onKeyDown={descriptionHistory.handleKeyDown}
                placeholder="What is this project about? Add context, scope, goals... The field grows as you type."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm leading-relaxed text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
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
              onClick={onOpenCreateProject || startCreatingNew}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Project</span>
              <kbd className="text-[10px] bg-indigo-700/80 text-indigo-100 px-1.5 py-0.2 rounded font-mono ml-0.5">
                P
              </kbd>
            </button>
          </div>
        ) : (
          /* Projects Grid: Clickable Project Cards (NO tasks shown on this page!) */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map(project => {
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
                  className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group flex flex-col justify-between hover:shadow-xl hover:-translate-y-0.5 relative overflow-hidden"
                >
                  <div>
                    {/* Top row: Icon, task count badge, & action buttons */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                          <FolderKanban className="w-3.5 h-3.5" />
                        </div>
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
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 min-h-[2rem] whitespace-pre-wrap break-words">
                      {project.description || 'No description provided'}
                    </p>
                  </div>

                  {/* Bottom Stats & Progress */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80">
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden mb-2.5">
                      <div 
                        className="h-full rounded-full transition-all duration-300 bg-indigo-500"
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

      {/* Custom Confirmation Modal */}
      {renderConfirmModal()}
    </div>
  );
}

// =========================================================================
// VIEW 2: PROJECT DETAIL (Inside a selected project -> Tasks list & adding)
// =========================================================================
  return (
    <div className="max-w-4xl mx-auto py-8 pb-32 px-4 animate-fade-in">
      
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
                Description
              </label>
              <AutoGrowTextarea
                ref={descriptionRef}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                onKeyDown={descriptionHistory.handleKeyDown}
                placeholder="What is this project about? Add context, scope, goals..."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm leading-relaxed text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
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
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg relative overflow-hidden">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shadow-inner shrink-0 mt-0.5">
                  <FolderKanban className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl font-extrabold text-white tracking-tight">
                    {activeProject.title}
                  </h1>
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

            {/* Project Description (newlines preserved exactly as typed) */}
            {activeProject.description && (
              <p className="text-xs text-slate-300 mt-3 leading-relaxed whitespace-pre-wrap break-words">
                {activeProject.description}
              </p>
            )}

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
                  className="h-full rounded-full transition-all duration-300 bg-indigo-500"
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
            Ordered sequence (Drag to reorder)
          </span>
        </div>

        {/* Task List (Drag & Drop Reordering) */}
        {projectTasks.length === 0 ? (
          <div className="py-12 px-6 rounded-3xl bg-slate-900/40 border border-dashed border-slate-800 text-center">
            <p className="text-xs text-slate-400 mb-1">
              No tasks inside this project yet.
            </p>
            <p className="text-[11px] text-slate-500">
              Search an existing task to link or type a new task name below.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {projectTasks.map((task, index) => {
              const isCompleted = task.status === 'completed';
              const isInProgress = task.status === 'in_progress';
              const isDraggingThis = draggedIndex === index;
              const isDragOverThis = dragOverIndex === index && draggedIndex !== index;

              return (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => handleDragStart(index, e)}
                  onDragOver={(e) => handleDragOver(index, e)}
                  onDragEnd={handleDragEnd}
                  onDrop={(e) => handleDrop(index, e)}
                  className={`p-3 sm:p-3.5 rounded-2xl border transition-all duration-150 flex items-center justify-between gap-3 cursor-grab active:cursor-grabbing select-none group ${
                    isDraggingThis
                      ? 'opacity-30 border-dashed border-indigo-500 bg-indigo-950/20 scale-[0.99]'
                      : isDragOverThis
                      ? 'border-indigo-500 bg-indigo-950/40 shadow-lg ring-1 ring-indigo-500 scale-[1.01]'
                      : isCompleted 
                      ? 'bg-slate-900/30 border-slate-900 text-slate-500 hover:border-slate-800' 
                      : isInProgress
                      ? 'bg-indigo-950/20 border-indigo-500/40 shadow-sm hover:border-indigo-500/60'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Left: Drag Handle + Order Number + Status Checkbox + Details */}
                  <div className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
                    
                    {/* Drag Grip Handle */}
                    <div 
                      className="p-1 -ml-1 text-slate-600 group-hover:text-slate-400 transition shrink-0" 
                      title="Drag to reorder"
                    >
                      <GripVertical className="w-4 h-4" />
                    </div>

                    {/* Sequential step badge */}
                    <span className="font-mono text-[11px] font-bold text-slate-500 shrink-0 w-6">
                      #{index + 1}
                    </span>

                    {/* Task Title & Tags */}
                    <div className="truncate flex-1 min-w-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openTaskEditor(task);
                        }}
                        title="Click to edit this task"
                        className={`group/title inline-flex items-center gap-1 text-xs font-medium block truncate text-left hover:text-indigo-300 transition ${
                          isCompleted ? 'line-through text-slate-500' : 'text-slate-100'
                        }`}
                      >
                        {task.title}
                        <Edit3 className="w-3 h-3 text-slate-600 group-hover/title:text-indigo-400 shrink-0 ml-1" />
                      </button>
                      
                      <div className="flex items-center gap-2 mt-0.5">
                        {isCompleted && (
                          <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Done
                          </span>
                        )}
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
                  <div 
                    className="flex items-center gap-1 shrink-0"
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    {!isCompleted && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartTask(task.id);
                        }}
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
                      title="Delete task (Ctrl+Z to undo)"
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

      {/* Inline Task Editor (opened by clicking a task title) */}
      {editingTaskId && (() => {
        const task = projectTasks.find(t => t.id === editingTaskId);
        if (!task) return null;
        return (
          <div className="mb-8 p-5 rounded-3xl bg-slate-900 border border-indigo-500/40 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-indigo-400" />
                <span>Edit Task</span>
              </h3>
              <button
                onClick={closeTaskEditor}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Title *
                </label>
                <input
                  ref={editTitleRef}
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Next Action (GTD)
                </label>
                <input
                  type="text"
                  value={editNextAction}
                  onChange={(e) => setEditNextAction(e.target.value)}
                  placeholder="The very next physical, visible step..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Definition of Done
                </label>
                <AutoGrowTextarea
                  value={editDoD}
                  onChange={(e) => setEditDoD(e.target.value)}
                  placeholder="When is this task truly finished?"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm leading-relaxed text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Notes
                </label>
                <AutoGrowTextarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Scraps, links, context..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm leading-relaxed text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Context</label>
                  <select
                    value={editContext}
                    onChange={(e) => setEditContext(e.target.value as GTDContext)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="@computer">💻 @computer</option>
                    <option value="@phone">📱 @phone</option>
                    <option value="@errands">🚗 @errands</option>
                    <option value="@home">🏠 @home</option>
                    <option value="@anywhere">🌍 @anywhere</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Energy</label>
                  <select
                    value={editEnergy}
                    onChange={(e) => setEditEnergy(e.target.value as EnergyLevel)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Importance</label>
                  <select
                    value={editImportance}
                    onChange={(e) => setEditImportance(e.target.value as TaskImportance)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Duration</label>
                  <select
                    value={editMinutes}
                    onChange={(e) => setEditMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value={5}>5m</option>
                    <option value={15}>15m</option>
                    <option value={25}>25m</option>
                    <option value={45}>45m</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Recurrence</label>
                <select
                  value={editRecurrence}
                  onChange={(e) => setEditRecurrence(e.target.value as RecurrenceInterval)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="none">No repeat</option>
                  <option value="daily">Daily</option>
                  <option value="every_2_days">Every 2 days</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeTaskEditor}
                  className="px-3.5 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => saveTaskEditor(task)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition active:scale-95 flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 3. Add Tasks Section (Searchable Unified Input to Link or Create New Task) */}
      <div className="pt-6 border-t border-slate-900" ref={taskSearchContainerRef}>
        <div className="p-4 sm:p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-sm relative">
          
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-indigo-400" />
              <span>Add or Link Task to Project</span>
            </span>
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              Type to search & link existing tasks, or press Enter to create a new task
            </span>
          </div>

          <form onSubmit={handleUnifiedSubmit} className="relative">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  ref={unifiedInputRef}
                  type="text"
                  value={taskQuery}
                  onChange={(e) => {
                    setTaskQuery(e.target.value);
                    setIsSuggestionsOpen(true);
                    setHighlightedIndex(-1);
                  }}
                  onFocus={() => setIsSuggestionsOpen(true)}
                  onKeyDown={handleInputKeyDown}
                  placeholder="Search existing task to link, or type new task name..."
                  className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                />
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                {taskQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setTaskQuery('');
                      setHighlightedIndex(-1);
                      unifiedInputRef.current?.focus();
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={!taskQuery.trim()}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold shadow transition active:scale-95 shrink-0 flex items-center gap-1.5"
              >
                {exactMatchingTask ? (
                  <>
                    <Link2 className="w-3.5 h-3.5" />
                    <span>Link Task</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Task</span>
                  </>
                )}
              </button>
            </div>

            {/* Live Search Suggestions & Fallback to New Task */}
            {isSuggestionsOpen && (
              <div className="absolute left-0 right-0 top-full mt-2 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl max-h-72 overflow-y-auto z-40 p-1.5 animate-fade-in divide-y divide-slate-800/60">
                
                {/* Section A: Matching Existing Tasks to Link */}
                {matchingTasks.length > 0 && (
                  <div className="py-1">
                    <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Link2 className="w-3 h-3 text-sky-400" />
                        <span>Link Existing Task ({matchingTasks.length})</span>
                      </span>
                      <span>Click to link</span>
                    </div>

                    <div className="space-y-0.5 mt-1">
                      {matchingTasks.slice(0, 8).map((task, idx) => {
                        const isHighlighted = highlightedIndex === idx;
                        return (
                          <button
                            key={task.id}
                            type="button"
                            onClick={() => handleSelectLinkTask(task.id)}
                            onMouseEnter={() => setHighlightedIndex(idx)}
                            className={`w-full text-left px-3 py-2 rounded-xl transition flex items-center justify-between text-xs group ${
                              isHighlighted ? 'bg-indigo-600 text-white shadow-sm' : 'hover:bg-slate-800/80 text-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate mr-2 min-w-0">
                              <Link2 className={`w-3.5 h-3.5 shrink-0 ${isHighlighted ? 'text-white' : 'text-slate-400 group-hover:text-sky-400'}`} />
                              <span className="truncate">{task.title}</span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                                isHighlighted ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-950 text-slate-400 border border-slate-800'
                              }`}>
                                {task.status}
                              </span>
                              <span className={`text-[10px] font-semibold opacity-0 group-hover:opacity-100 transition ${
                                isHighlighted ? 'opacity-100 text-indigo-100' : 'text-sky-400'
                              }`}>
                                Link ↵
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Section B: Create as New Task Option */}
                {taskQuery.trim() && (
                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => handleCreateNewTask(taskQuery.trim())}
                      onMouseEnter={() => setHighlightedIndex(matchingTasks.length)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl transition flex items-center justify-between text-xs group ${
                        highlightedIndex === matchingTasks.length
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : matchingTasks.length === 0
                          ? 'bg-slate-950/80 text-slate-100 border border-indigo-500/30'
                          : 'hover:bg-slate-800/80 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate min-w-0 mr-2">
                        <Plus className={`w-4 h-4 shrink-0 ${
                          highlightedIndex === matchingTasks.length ? 'text-white' : 'text-indigo-400'
                        }`} />
                        <span className="truncate">
                          Create new task: <strong className="text-white font-semibold">"{taskQuery.trim()}"</strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {matchingTasks.length === 0 && (
                          <span className="text-[10px] text-slate-400 hidden sm:inline">
                            No match found
                          </span>
                        )}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${
                          highlightedIndex === matchingTasks.length
                            ? 'bg-indigo-700 text-white'
                            : 'bg-indigo-600 text-white shadow-sm'
                        }`}>
                          Press Enter ↵
                        </span>
                      </div>
                    </button>
                  </div>
                )}

                {/* Empty State when query is empty and no available tasks to link */}
                {!taskQuery.trim() && availableTasksToLink.length === 0 && (
                  <div className="py-3 px-4 text-center text-xs text-slate-400">
                    No unlinked tasks available. Type any task name and press Enter to create a new task.
                  </div>
                )}

              </div>
            )}
          </form>
        </div>
      </div>

      {/* Custom Confirmation Modal */}
      {renderConfirmModal()}
    </div>
  );
};

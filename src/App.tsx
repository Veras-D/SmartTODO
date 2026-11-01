import React, { useState, useEffect } from 'react';
import { TaskProvider, useTaskContext } from './context/TaskContext';
import { Navbar } from './components/Navbar';
import { FocusHUD } from './components/FocusHUD';
import { TasksView } from './components/TasksView';
import { ProjectsView } from './components/ProjectsView';
import { QuickCaptureModal } from './components/QuickCaptureModal';
import { CreateProjectModal } from './components/CreateProjectModal';
import { BacklogBankruptcyModal } from './components/BacklogBankruptcyModal';
import { UndoToast } from './components/UndoToast';

const MainLayout: React.FC = () => {
  const { undo, redo } = useTaskContext();
  const [currentTab, setCurrentTab] = useState<'focus' | 'tasks' | 'projects'>('focus');
  const [tasksNavKey, setTasksNavKey] = useState<number>(0);
  const [projectsNavKey, setProjectsNavKey] = useState<number>(0);
  const [directOpenProjectId, setDirectOpenProjectId] = useState<string | null>(null);
  
  const handleTabChange = (tab: 'focus' | 'tasks' | 'projects') => {
    setCurrentTab(tab);
    if (tab === 'tasks') {
      setTasksNavKey(prev => prev + 1);
    }
    if (tab === 'projects') {
      setProjectsNavKey(prev => prev + 1);
    }
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  };

  const handleOpenTasksTab = () => {
    handleTabChange('tasks');
  };

  // Modals state
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [isBankruptcyOpen, setIsBankruptcyOpen] = useState(false);

  // Global hotkeys: 'N' for quick task capture, 'P' to create new project,
  // Ctrl+Z / Ctrl+Shift+Z (or Ctrl+Y) to undo / redo destructive actions
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isEditable = !!target && (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      );
      const withModifier = e.ctrlKey || e.metaKey;

      if (withModifier && (e.key === 'z' || e.key === 'Z')) {
        // Inside a text field let the browser undo the typing itself
        if (isEditable) return;
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
        return;
      }

      if (withModifier && (e.key === 'y' || e.key === 'Y')) {
        if (isEditable) return;
        e.preventDefault();
        redo();
        return;
      }

      if (isEditable) return;

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setIsQuickCaptureOpen(true);
      } else if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        setIsCreateProjectOpen(true);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [undo, redo]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Minimal Top Navigation */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={handleTabChange}
        onOpenQuickCapture={() => setIsQuickCaptureOpen(true)}
        onOpenCreateProject={() => setIsCreateProjectOpen(true)}
        onOpenBankruptcy={() => setIsBankruptcyOpen(true)}
      />

      {/* Main Focus, Tasks, or Projects view */}
      <main className="flex-1 pb-12">
        <div className={currentTab === 'focus' ? 'block' : 'hidden'}>
          <FocusHUD onOpenTasksTab={handleOpenTasksTab} />
        </div>
        <div className={currentTab === 'tasks' ? 'block' : 'hidden'}>
          <TasksView 
            isVisible={currentTab === 'tasks'}
            tasksNavKey={tasksNavKey}
            onSelectTaskForFocus={() => handleTabChange('focus')} 
          />
        </div>
        <div className={currentTab === 'projects' ? 'block' : 'hidden'}>
          <ProjectsView 
            projectsNavKey={projectsNavKey}
            onSelectTaskForFocus={() => handleTabChange('focus')} 
            onOpenCreateProject={() => setIsCreateProjectOpen(true)}
            directOpenProjectId={directOpenProjectId}
          />
        </div>
      </main>

      {/* Clean Modals for Quick Capture, Create Project & Reset */}
      <QuickCaptureModal
        isOpen={isQuickCaptureOpen}
        onClose={() => setIsQuickCaptureOpen(false)}
      />

      <CreateProjectModal
        isOpen={isCreateProjectOpen}
        onClose={() => setIsCreateProjectOpen(false)}
        onProjectCreated={(newProject) => {
          handleTabChange('projects');
          setDirectOpenProjectId(newProject.id);
        }}
      />

      <BacklogBankruptcyModal
        isOpen={isBankruptcyOpen}
        onClose={() => setIsBankruptcyOpen(false)}
      />

      {/* Undo affordance for deletes and other destructive actions */}
      <UndoToast />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <TaskProvider>
      <MainLayout />
    </TaskProvider>
  );
};

export default App;

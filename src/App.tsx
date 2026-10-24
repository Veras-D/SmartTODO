import React, { useState, useEffect } from 'react';
import { TaskProvider } from './context/TaskContext';
import { Navbar } from './components/Navbar';
import { FocusHUD } from './components/FocusHUD';
import { TasksView } from './components/TasksView';
import { ProjectsView } from './components/ProjectsView';
import { QuickCaptureModal } from './components/QuickCaptureModal';
import { BacklogBankruptcyModal } from './components/BacklogBankruptcyModal';

const MainLayout: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<'focus' | 'tasks' | 'projects'>('focus');
  const [tasksNavKey, setTasksNavKey] = useState<number>(0);
  
  const handleOpenTasksTab = () => {
    setCurrentTab('tasks');
    setTasksNavKey(prev => prev + 1);
  };

  // Modals state
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);
  const [isBankruptcyOpen, setIsBankruptcyOpen] = useState(false);

  // Global hotkeys: 'N' for quick capture, 'P' for projects tab
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setIsQuickCaptureOpen(true);
      } else if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        setCurrentTab('projects');
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Minimal Top Navigation */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          setCurrentTab(tab);
          if (tab === 'tasks') {
            setTasksNavKey(prev => prev + 1);
          }
        }}
        onOpenQuickCapture={() => setIsQuickCaptureOpen(true)}
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
            onSelectTaskForFocus={() => setCurrentTab('focus')} 
          />
        </div>
        <div className={currentTab === 'projects' ? 'block' : 'hidden'}>
          <ProjectsView 
            onSelectTaskForFocus={() => setCurrentTab('focus')} 
          />
        </div>
      </main>

      {/* Clean Modals for Quick Capture & Reset */}
      <QuickCaptureModal
        isOpen={isQuickCaptureOpen}
        onClose={() => setIsQuickCaptureOpen(false)}
      />

      <BacklogBankruptcyModal
        isOpen={isBankruptcyOpen}
        onClose={() => setIsBankruptcyOpen(false)}
      />
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

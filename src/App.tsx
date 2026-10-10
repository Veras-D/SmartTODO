import React, { useState, useEffect } from 'react';
import { TaskProvider } from './context/TaskContext';
import { Navbar } from './components/Navbar';
import { FocusHUD } from './components/FocusHUD';
import { TasksView } from './components/TasksView';
import { QuickCaptureModal } from './components/QuickCaptureModal';
import { BacklogBankruptcyModal } from './components/BacklogBankruptcyModal';

const MainLayout: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<'focus' | 'tasks'>('focus');
  
  // Modals state
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);
  const [isBankruptcyOpen, setIsBankruptcyOpen] = useState(false);

  // Global hotkey: 'N' to open quick capture
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setIsQuickCaptureOpen(true);
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
        setCurrentTab={setCurrentTab}
        onOpenQuickCapture={() => setIsQuickCaptureOpen(true)}
        onOpenBankruptcy={() => setIsBankruptcyOpen(true)}
      />

      {/* Main Focus or Tasks view */}
      <main className="flex-1 pb-12">
        {currentTab === 'focus' ? (
          <FocusHUD onOpenTasksTab={() => setCurrentTab('tasks')} />
        ) : (
          <TasksView onSelectTaskForFocus={() => setCurrentTab('focus')} />
        )}
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

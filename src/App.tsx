import React, { useState, useEffect } from 'react';
import { TaskProvider } from './context/TaskContext';
import { Navbar } from './components/Navbar';
import { FocusHUD } from './components/FocusHUD';
import { SmartifyLounge } from './components/SmartifyLounge';
import { ColdStorageView } from './components/ColdStorageView';
import { CantDoModal } from './components/CantDoModal';
import { QuickCaptureModal } from './components/QuickCaptureModal';
import { GoogleKeepImporterModal } from './components/GoogleKeepImporterModal';
import { BacklogBankruptcyModal } from './components/BacklogBankruptcyModal';

const MainLayout: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<'hud' | 'smartify' | 'archive'>('hud');
  
  // Modals state
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);
  const [isCantDoOpen, setIsCantDoOpen] = useState(false);
  const [isKeepImporterOpen, setIsKeepImporterOpen] = useState(false);
  const [isBankruptcyOpen, setIsBankruptcyOpen] = useState(false);

  // Global hotkey listener: 'N' to open quick capture
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
      {/* Top Navigation */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenQuickCapture={() => setIsQuickCaptureOpen(true)}
        onOpenKeepImporter={() => setIsKeepImporterOpen(true)}
        onOpenBankruptcy={() => setIsBankruptcyOpen(true)}
      />

      {/* Main Tab Content */}
      <main className="flex-1 pb-16">
        {currentTab === 'hud' && (
          <FocusHUD
            onOpenCantDoModal={() => setIsCantDoOpen(true)}
            onOpenSmartifyTab={() => setCurrentTab('smartify')}
          />
        )}
        {currentTab === 'smartify' && <SmartifyLounge />}
        {currentTab === 'archive' && <ColdStorageView />}
      </main>

      {/* Modals */}
      <QuickCaptureModal
        isOpen={isQuickCaptureOpen}
        onClose={() => setIsQuickCaptureOpen(false)}
      />

      <CantDoModal
        isOpen={isCantDoOpen}
        onClose={() => setIsCantDoOpen(false)}
      />

      <GoogleKeepImporterModal
        isOpen={isKeepImporterOpen}
        onClose={() => setIsKeepImporterOpen(false)}
        onImportComplete={() => setCurrentTab('smartify')}
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

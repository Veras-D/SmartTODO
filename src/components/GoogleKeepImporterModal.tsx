import React, { useState } from 'react';
import { X, FileDown, CheckCircle2, ArrowRight } from 'lucide-react';
import { useTaskContext } from '../context/TaskContext';
import { parseGoogleKeepText } from '../utils/storage';

interface GoogleKeepImporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

export const GoogleKeepImporterModal: React.FC<GoogleKeepImporterModalProps> = ({
  isOpen,
  onClose,
  onImportComplete
}) => {
  const { importKeepNotes } = useTaskContext();
  const [inputText, setInputText] = useState('');

  if (!isOpen) return null;

  const detectedTasks = parseGoogleKeepText(inputText);

  const handleImport = () => {
    if (detectedTasks.length === 0) return;
    importKeepNotes(inputText);
    setInputText('');
    onClose();
    onImportComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2.5 mb-2">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <FileDown className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Import from Google Keep / Notes</h2>
            <p className="text-xs text-slate-400">
              Paste your checklist or notes below. We will parse every line into an inbox task.
            </p>
          </div>
        </div>

        {/* Textarea */}
        <div className="mt-4">
          <textarea
            rows={7}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Paste from Google Keep here, e.g.:
- [ ] Buy groceries
- [ ] Schedule dentist appointment
- Call landlord about AC`}
            className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Preview detection */}
        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="text-slate-400">
            Detected: <b className="text-amber-400">{detectedTasks.length}</b> tasks
          </span>
          {detectedTasks.length > 0 && (
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Ready to parse</span>
            </span>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={detectedTasks.length === 0}
            className={`px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg shadow-amber-600/30 flex items-center gap-1.5 transition ${
              detectedTasks.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <span>Import {detectedTasks.length} to Inbox</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
};

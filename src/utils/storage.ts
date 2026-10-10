import { Task } from '../types/task';

const STORAGE_KEY = 'smart_todo_tasks_v1';
const SOUND_SETTING_KEY = 'smart_todo_sound_enabled';

export const INITIAL_SEED_TASKS: Task[] = [
  {
    id: 'seed-1',
    title: 'Drink a fresh glass of water',
    definitionOfDone: 'Glass is finished and placed in sink',
    notes: 'Hydration helps reset executive focus',
    status: 'ready',
    energyLevel: 'low',
    estimatedMinutes: 2,
    microSteps: [
      { id: 's1-1', title: 'Walk to kitchen', completed: false },
      { id: 's1-2', title: 'Fill glass', completed: false },
      { id: 's1-3', title: 'Drink slowly', completed: false }
    ],
    blockers: [],
    frictionBusterStep: 'Just take 3 sips right now',
    skipCount: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: 'seed-2',
    title: 'Import your Google Keep notes into SmartTODO',
    definitionOfDone: 'Notes pasted and converted into inbox items',
    notes: 'Use the Google Keep Importer in the top menu to clear your notes graveyard',
    status: 'ready',
    energyLevel: 'low',
    estimatedMinutes: 5,
    microSteps: [
      { id: 's2-1', title: 'Open Google Keep tab', completed: false },
      { id: 's2-2', title: 'Copy task lines', completed: false },
      { id: 's2-3', title: 'Paste into SmartTODO Importer', completed: false }
    ],
    blockers: [],
    frictionBusterStep: 'Just copy 1 note from Google Keep',
    skipCount: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: 'seed-3',
    title: 'Clean desk surface',
    definitionOfDone: 'Clear 80% of clutter off the main tabletop',
    notes: 'Reduces visual noise and distraction',
    status: 'ready',
    energyLevel: 'medium',
    estimatedMinutes: 10,
    microSteps: [
      { id: 's3-1', title: 'Put away empty cups and wrappers', completed: false },
      { id: 's3-2', title: 'Stack notebook and pens', completed: false }
    ],
    blockers: [],
    frictionBusterStep: 'Just throw away one wrapper or empty cup',
    skipCount: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: 'seed-4',
    title: 'Review project milestones',
    definitionOfDone: 'All 3 milestones have dates assigned',
    notes: 'Blocked until dependencies are gathered',
    status: 'blocked',
    energyLevel: 'high',
    estimatedMinutes: 30,
    microSteps: [],
    blockers: [
      { id: 'b4-1', text: 'Waiting for team feedback on draft', resolved: false }
    ],
    skipCount: 0,
    createdAt: new Date().toISOString()
  }
];

export function loadStoredTasks(): Task[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveTasksToStorage(INITIAL_SEED_TASKS);
      return INITIAL_SEED_TASKS;
    }
    const parsed = JSON.parse(raw) as Task[];
    return Array.isArray(parsed) ? parsed : INITIAL_SEED_TASKS;
  } catch (error) {
    console.error('Failed to load tasks from localStorage:', error);
    return INITIAL_SEED_TASKS;
  }
}

export function saveTasksToStorage(tasks: Task[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error('Failed to save tasks to localStorage:', error);
  }
}

export function loadSoundSetting(): boolean {
  try {
    const raw = localStorage.getItem(SOUND_SETTING_KEY);
    return raw !== null ? raw === 'true' : true;
  } catch {
    return true;
  }
}

export function saveSoundSetting(enabled: boolean): void {
  try {
    localStorage.setItem(SOUND_SETTING_KEY, enabled ? 'true' : 'false');
  } catch {
    // ignore
  }
}

// Parse Google Keep text dump (handles markdown checkboxes, bullets, or plain lines)
export function parseGoogleKeepText(text: string): { title: string; notes?: string }[] {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const tasks: { title: string; notes?: string }[] = [];

  for (const line of lines) {
    // Strip checkbox formats like "- [ ]", "[ ]", "•", "-", "*", or numbers "1."
    const cleaned = line
      .replace(/^[-*•]\s*(\[[ xX]?\]\s*)?/, '')
      .replace(/^\[[ xX]?\]\s*/, '')
      .replace(/^\d+[\.\)]\s*/, '')
      .trim();

    if (cleaned.length > 0) {
      tasks.push({ title: cleaned });
    }
  }

  return tasks;
}

// Generate unique ID
export function generateId(): string {
  return 'task-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now().toString(36);
}

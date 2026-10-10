import { Task } from '../types/task';

const STORAGE_KEY = 'smart_todo_tasks_v2';
const LEGACY_STORAGE_KEY = 'smart_todo_tasks_v1';
const SOUND_SETTING_KEY = 'smart_todo_sound_enabled';

export function loadStoredTasks(): Task[] {
  try {
    // Check current storage key
    let raw = localStorage.getItem(STORAGE_KEY);
    
    // Fallback to check legacy key if v2 not found
    if (!raw) {
      raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    }
    
    if (!raw) {
      return [];
    }
    
    const parsed = JSON.parse(raw) as Task[];
    if (!Array.isArray(parsed)) return [];
    
    // Strictly filter out any previous seed tasks
    const userOnlyTasks = parsed.filter(t => !t.id.startsWith('seed-'));
    saveTasksToStorage(userOnlyTasks);
    return userOnlyTasks;
  } catch (error) {
    console.error('Failed to load tasks from localStorage:', error);
    return [];
  }
}

export function saveTasksToStorage(tasks: Task[]): void {
  try {
    // Filter out any seed tasks
    const userOnlyTasks = tasks.filter(t => !t.id.startsWith('seed-'));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userOnlyTasks));
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

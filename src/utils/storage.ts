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
    
    // Auto-rollover due recurring tasks from done to ready
    const { tasks: rolledOver, changed } = rolloverRecurringTasks(userOnlyTasks);
    if (changed) {
      saveTasksToStorage(rolledOver);
    }
    return rolledOver;
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

// Generate unique ID
export function generateId(): string {
  return 'task-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now().toString(36);
}

// Compute the next due date for recurring tasks
export function calculateNextDueDate(recurrence?: import('../types/task').RecurrenceInterval): string {
  const date = new Date();
  if (recurrence === 'daily') {
    date.setDate(date.getDate() + 1);
  } else if (recurrence === 'every_2_days') {
    date.setDate(date.getDate() + 2);
  } else if (recurrence === 'weekly') {
    date.setDate(date.getDate() + 7);
  } else if (recurrence === 'monthly') {
    date.setMonth(date.getMonth() + 1);
  } else {
    date.setDate(date.getDate() + 1);
  }
  return date.toISOString().split('T')[0];
}

// Automatically roll over due recurring tasks from done (completed) to ready
export function rolloverRecurringTasks(tasks: Task[]): { tasks: Task[]; changed: boolean } {
  const today = new Date().toISOString().split('T')[0];
  let changed = false;

  const updatedTasks = tasks.map(task => {
    // Only process recurring tasks
    if (!task.recurrence || task.recurrence === 'none') {
      return task;
    }

    const wasCompletedToday = (
      (task.completedAt && task.completedAt.startsWith(today)) ||
      (task.lastCompletedAt && task.lastCompletedAt.startsWith(today))
    );

    // 1. If task is in 'completed' status
    if (task.status === 'completed') {
      // If it was completed today, ensure it has a future nextDueDate and stays completed today
      if (wasCompletedToday) {
        if (!task.nextDueDate || task.nextDueDate <= today) {
          changed = true;
          return {
            ...task,
            nextDueDate: calculateNextDueDate(task.recurrence)
          };
        }
        return task;
      }

      // If it was completed before today (or has no completed date), check if it's due
      const isDue = !task.nextDueDate || task.nextDueDate <= today;
      if (isDue) {
        changed = true;
        return {
          ...task,
          status: 'ready' as import('../types/task').TaskStatus,
          completedAt: undefined,
          nextDueDate: undefined,
          microSteps: task.microSteps ? task.microSteps.map(s => ({ ...s, completed: false })) : []
        };
      }
    }

    // 2. If a recurring task is in 'ready' status
    if (task.status === 'ready') {
      // If it was completed today and nextDueDate is in the future, it belongs in 'completed' (Done tab) for today
      if (wasCompletedToday && task.nextDueDate && task.nextDueDate > today) {
        changed = true;
        return {
          ...task,
          status: 'completed' as import('../types/task').TaskStatus,
          completedAt: task.lastCompletedAt || new Date().toISOString()
        };
      }

      // If its nextDueDate has arrived or passed, clear it so it's active today without a stale badge
      if (task.nextDueDate && task.nextDueDate <= today) {
        changed = true;
        return {
          ...task,
          nextDueDate: undefined
        };
      }
    }

    return task;
  });

  return { tasks: changed ? updatedTasks : tasks, changed };
}

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { Task, EnergyLevel, RouletteFilter, TaskStatus } from '../types/task';
import { 
  loadStoredTasks, 
  saveTasksToStorage, 
  loadSoundSetting, 
  saveSoundSetting, 
  generateId,
  calculateNextDueDate 
} from '../utils/storage';
import { soundManager } from '../utils/sound';

interface TaskContextType {
  tasks: Task[];
  activeTask: Task | null;
  filter: RouletteFilter;
  setFilter: (filter: RouletteFilter) => void;
  soundEnabled: boolean;
  toggleSound: () => void;
  isRolling: boolean;
  
  // Actions
  rollRandomTask: () => void;
  startTaskDirectly: (taskId: string) => void;
  completeActiveTask: () => void;
  handleCantDo: (reason: 'too_tired' | 'blocked' | 'not_now' | 'cold_storage', blockerText?: string) => void;
  activateFrictionBuster: () => void;
  toggleMicroStep: (taskId: string, stepId: string) => void;
  addQuickTask: (title: string) => Task;
  createOrUpdateTask: (task: Partial<Task> & { title: string }) => void;
  deleteTask: (id: string) => void;
  restoreFromColdStorage: (id: string) => void;
  declareBankruptcy: () => number;
  
  // Filtered queries
  unblockedReadyTasks: Task[];
  inboxTasks: Task[];
  completedTodayCount: number;
  coldStorageTasks: Task[];
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>(() => loadStoredTasks());
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [filter, setFilter] = useState<RouletteFilter>('all');
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => loadSoundSetting());

  // Sync sound setting
  useEffect(() => {
    soundManager.enabled = soundEnabled;
    saveSoundSetting(soundEnabled);
  }, [soundEnabled]);

  // Sync tasks to local storage
  useEffect(() => {
    saveTasksToStorage(tasks);
  }, [tasks]);

  const toggleSound = () => {
    setSoundEnabled(prev => !prev);
  };

  // Derive unblocked, ready tasks matching today's criteria
  const unblockedReadyTasks = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return tasks.filter(t => {
      // Must be ready or in_progress status
      if (t.status !== 'ready' && t.status !== 'in_progress') return false;

      // Must NOT be snoozed for today
      if (t.snoozedUntil && t.snoozedUntil.startsWith(today)) return false;

      // Must be due today or earlier if recurring
      if (t.nextDueDate && t.nextDueDate > today) return false;

      // Must have zero unresolved blockers
      const hasUnresolvedBlockers = t.blockers.some(b => !b.resolved);
      if (hasUnresolvedBlockers) return false;

      return true;
    });
  }, [tasks]);

  // Tasks in inbox waiting for GTD clarification
  const inboxTasks = useMemo(() => {
    return tasks.filter(t => t.status === 'inbox');
  }, [tasks]);

  // Cold storage tasks
  const coldStorageTasks = useMemo(() => {
    return tasks.filter(t => t.status === 'cold_storage');
  }, [tasks]);

  // Completed today counter for dopamine progress (includes recurring completions)
  const completedTodayCount = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return tasks.filter(t => 
      (t.status === 'completed' && t.completedAt && t.completedAt.startsWith(today)) ||
      (t.lastCompletedAt && t.lastCompletedAt.startsWith(today))
    ).length;
  }, [tasks]);

  // Get current active task
  const activeTask = useMemo(() => {
    if (!activeTaskId) return null;
    return tasks.find(t => t.id === activeTaskId) || null;
  }, [tasks, activeTaskId]);

  // Filter pool based on active energy/time filter
  const getEligibleRollPool = useCallback((): Task[] => {
    return unblockedReadyTasks.filter(t => {
      if (filter === 'low_energy') {
        return t.energyLevel === 'low';
      }
      if (filter === 'deep_focus') {
        return t.energyLevel === 'high';
      }
      if (filter === 'quick_win') {
        return t.estimatedMinutes <= 10;
      }
      return true;
    });
  }, [unblockedReadyTasks, filter]);

  // Roll Random Task with tactile animation and sound
  const rollRandomTask = useCallback(() => {
    const pool = getEligibleRollPool();
    if (pool.length === 0) {
      setActiveTaskId(null);
      return;
    }

    // Exclude current task from immediate reroll if there are other choices
    const candidates = pool.length > 1 && activeTaskId
      ? pool.filter(t => t.id !== activeTaskId)
      : pool;

    setIsRolling(true);

    // Animate roulette ticking
    let ticks = 0;
    const maxTicks = 8;
    const interval = setInterval(() => {
      ticks++;
      soundManager.playRollTick(1.0 + (ticks * 0.05));
      // Pick temporary candidate for visual flicker
      const tempPick = candidates[Math.floor(Math.random() * candidates.length)];
      setActiveTaskId(tempPick.id);

      if (ticks >= maxTicks) {
        clearInterval(interval);
        // Final landing
        const finalPick = candidates[Math.floor(Math.random() * candidates.length)];
        setActiveTaskId(finalPick.id);
        setIsRolling(false);
        soundManager.playLandSound();
      }
    }, 90);
  }, [getEligibleRollPool, activeTaskId]);

  // Start a specific task directly (from Inbox or Task list)
  const startTaskDirectly = useCallback((taskId: string) => {
    setActiveTaskId(taskId);
    soundManager.playLandSound();
  }, []);

  // Complete Active Task
  const completeActiveTask = useCallback(() => {
    if (!activeTask) return;

    soundManager.playCompletionCelebration();
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6']
    });

    setTasks(prev => prev.map(t => {
      if (t.id === activeTask.id) {
        if (t.recurrence && t.recurrence !== 'none') {
          const nextDue = calculateNextDueDate(t.recurrence);
          return {
            ...t,
            status: 'ready' as TaskStatus,
            nextDueDate: nextDue,
            lastCompletedAt: new Date().toISOString(),
            microSteps: t.microSteps.map(s => ({ ...s, completed: false }))
          };
        } else {
          return {
            ...t,
            status: 'completed' as TaskStatus,
            completedAt: new Date().toISOString()
          };
        }
      }
      return t;
    }));

    setActiveTaskId(null);
  }, [activeTask]);

  // Handle "Can't do it now" adaptive response
  const handleCantDo = useCallback((reason: 'too_tired' | 'blocked' | 'not_now' | 'cold_storage', blockerText?: string) => {
    if (!activeTask) return;

    soundManager.playSkipSound();
    const today = new Date().toISOString();

    setTasks(prev => prev.map(t => {
      if (t.id === activeTask.id) {
        const updatedSkips = (t.skipCount || 0) + 1;

        if (reason === 'too_tired') {
          return {
            ...t,
            skipCount: updatedSkips,
            lastSkippedReason: 'too_tired'
          };
        } else if (reason === 'blocked') {
          const newBlocker = blockerText ? {
            id: generateId(),
            text: blockerText,
            resolved: false
          } : {
            id: generateId(),
            text: 'Need to clarify missing requirement',
            resolved: false
          };
          return {
            ...t,
            status: 'blocked' as TaskStatus,
            blockers: [...t.blockers, newBlocker],
            skipCount: updatedSkips,
            lastSkippedReason: 'blocked'
          };
        } else if (reason === 'not_now') {
          return {
            ...t,
            status: 'snoozed' as TaskStatus,
            snoozedUntil: today,
            skipCount: updatedSkips,
            lastSkippedReason: 'not_now'
          };
        } else if (reason === 'cold_storage') {
          return {
            ...t,
            status: 'cold_storage' as TaskStatus,
            archivedAt: today,
            skipCount: updatedSkips
          };
        }
      }
      return t;
    }));

    // If reason was 'too_tired', automatically adapt session filter to low_energy!
    if (reason === 'too_tired') {
      setFilter('low_energy');
    }

    setActiveTaskId(null);
  }, [activeTask]);

  // Activate Friction Buster (shrink task to 2-minute starter)
  const activateFrictionBuster = useCallback(() => {
    if (!activeTask) return;
    soundManager.playFrictionBusterSound();

    let buster = activeTask.frictionBusterStep;
    if (!buster) {
      buster = `Just spend 2 minutes opening ${activeTask.title} and reading the first line`;
    }

    setTasks(prev => prev.map(t => {
      if (t.id === activeTask.id) {
        return {
          ...t,
          frictionBusterStep: buster
        };
      }
      return t;
    }));
  }, [activeTask]);

  // Toggle MicroStep checkbox
  const toggleMicroStep = useCallback((taskId: string, stepId: string) => {
    soundManager.playRollTick(1.4);
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          microSteps: t.microSteps.map(s => s.id === stepId ? { ...s, completed: !s.completed } : s)
        };
      }
      return t;
    }));
  }, []);

  // Quick 1-line dump task into inbox
  const addQuickTask = useCallback((title: string): Task => {
    soundManager.playRollTick(1.2);
    const newTask: Task = {
      id: generateId(),
      title: title.trim(),
      status: 'inbox',
      energyLevel: 'medium',
      estimatedMinutes: 15,
      microSteps: [],
      blockers: [],
      skipCount: 0,
      createdAt: new Date().toISOString()
    };

    setTasks(prev => [newTask, ...prev]);
    return newTask;
  }, []);

  // Create or Update task details in SMART-ify lounge
  const createOrUpdateTask = useCallback((taskData: Partial<Task> & { title: string }) => {
    setTasks(prev => {
      const existing = prev.find(t => t.id === taskData.id);
      if (existing) {
        return prev.map(t => t.id === taskData.id ? { ...t, ...taskData } : t);
      } else {
        const newTask: Task = {
          id: generateId(),
          title: taskData.title,
          definitionOfDone: taskData.definitionOfDone || '',
          notes: taskData.notes || '',
          status: (taskData.status || 'ready') as TaskStatus,
          energyLevel: (taskData.energyLevel || 'medium') as EnergyLevel,
          estimatedMinutes: taskData.estimatedMinutes || 15,
          microSteps: taskData.microSteps || [],
          blockers: taskData.blockers || [],
          frictionBusterStep: taskData.frictionBusterStep || '',
          skipCount: 0,
          createdAt: new Date().toISOString()
        };
        return [newTask, ...prev];
      }
    });
  }, []);

  // Delete Task
  const deleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    if (activeTaskId === id) {
      setActiveTaskId(null);
    }
  }, [activeTaskId]);

  // Restore from Cold Storage
  const restoreFromColdStorage = useCallback((id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        return {
          ...t,
          status: 'ready' as TaskStatus,
          skipCount: 0,
          archivedAt: undefined
        };
      }
      return t;
    }));
  }, []);

  // Backlog Bankruptcy: archive tasks uncompleted > 14 days or skipped 4+ times
  const declareBankruptcy = useCallback((): number => {
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    let count = 0;

    setTasks(prev => prev.map(t => {
      if (t.status !== 'completed' && t.status !== 'cold_storage') {
        const isOld = t.createdAt < fourteenDaysAgo;
        const isRepeatedlySkipped = t.skipCount >= 4;

        if (isOld || isRepeatedlySkipped) {
          count++;
          return {
            ...t,
            status: 'cold_storage' as TaskStatus,
            archivedAt: new Date().toISOString()
          };
        }
      }
      return t;
    }));

    if (activeTask && (activeTask.createdAt < fourteenDaysAgo || activeTask.skipCount >= 4)) {
      setActiveTaskId(null);
    }

    return count;
  }, [activeTask]);

  return (
    <TaskContext.Provider
      value={{
        tasks,
        activeTask,
        filter,
        setFilter,
        soundEnabled,
        toggleSound,
        isRolling,
        rollRandomTask,
        startTaskDirectly,
        completeActiveTask,
        handleCantDo,
        activateFrictionBuster,
        toggleMicroStep,
        addQuickTask,
        createOrUpdateTask,
        deleteTask,
        restoreFromColdStorage,
        declareBankruptcy,
        unblockedReadyTasks,
        inboxTasks,
        completedTodayCount,
        coldStorageTasks
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export const useTaskContext = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTaskContext must be used within a TaskProvider');
  }
  return context;
};

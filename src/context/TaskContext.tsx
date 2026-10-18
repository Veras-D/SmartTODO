import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Task, EnergyLevel, RouletteFilter, TaskStatus } from '../types/task';
import { 
  loadStoredTasks, 
  saveTasksToStorage, 
  loadSoundSetting, 
  saveSoundSetting, 
  generateId,
  calculateNextDueDate,
  rolloverRecurringTasks 
} from '../utils/storage';
import { soundManager } from '../utils/sound';
import { unblockDependentTasks } from '../utils/taskDependencies';

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
  continueTaskLater: (taskId?: string) => void;
  resumeTask: (taskId: string) => void;
  moveToReadyPool: (taskId: string) => void;
  moveToInbox: (taskId: string) => void;
  completeActiveTask: () => void;
  handleCantDo: (reason: 'too_tired' | 'blocked' | 'not_now' | 'cold_storage', blockerText?: string) => void;
  activateFrictionBuster: () => void;
  toggleMicroStep: (taskId: string, stepId: string) => void;
  addQuickTask: (title: string) => Task;
  createOrUpdateTask: (task: Partial<Task> & { title: string }) => void;
  deleteTask: (id: string) => void;
  restoreFromColdStorage: (id: string) => void;
  declareBankruptcy: () => number;
  
  // Pomodoro Timer State & Actions
  timerSecondsLeft: number;
  timerTargetDuration: number;
  timerIsRunning: boolean;
  timerMode: 'focus' | 'break';
  timerIsFinished: boolean;
  toggleTimer: () => void;
  resetTimer: () => void;
  addTimerMinutes: (mins: number) => void;
  setTimerPreset: (mins: number, mode?: 'focus' | 'break') => void;

  // Filtered queries
  unblockedReadyTasks: Task[];
  unblockedInboxTasks: Task[];
  readyTasks: Task[];
  inProgressTasks: Task[];
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

  // Automatically roll over due recurring tasks from done to ready
  useEffect(() => {
    const checkRollover = () => {
      setTasks(prev => {
        const { tasks: updated, changed } = rolloverRecurringTasks(prev);
        return changed ? updated : prev;
      });
    };

    checkRollover();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkRollover();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    const interval = setInterval(checkRollover, 30000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(interval);
    };
  }, []);

  const toggleSound = () => {
    setSoundEnabled(prev => !prev);
  };

  // Pomodoro Timer state (persists across app tabs & browser backgrounding)
  const [timerTargetDuration, setTimerTargetDuration] = useState<number>(25 * 60);
  const [timerSecondsLeft, setTimerSecondsLeft] = useState<number>(25 * 60);
  const [timerIsRunning, setTimerIsRunning] = useState<boolean>(false);
  const [timerMode, setTimerMode] = useState<'focus' | 'break'>('focus');
  const [timerIsFinished, setTimerIsFinished] = useState<boolean>(false);
  const timerEndTimeRef = useRef<number | null>(null);

  // Synchronize timer loop using wall-clock timestamp
  useEffect(() => {
    if (!timerIsRunning) {
      timerEndTimeRef.current = null;
      return;
    }

    if (!timerEndTimeRef.current) {
      timerEndTimeRef.current = Date.now() + timerSecondsLeft * 1000;
    }

    const checkTimer = () => {
      if (!timerEndTimeRef.current) return;
      const msLeft = timerEndTimeRef.current - Date.now();
      const secs = Math.max(0, Math.ceil(msLeft / 1000));

      if (secs <= 0) {
        timerEndTimeRef.current = null;
        setTimerSecondsLeft(0);
        setTimerIsRunning(false);
        setTimerIsFinished(true);
        soundManager.playTimerChime();
      } else {
        setTimerSecondsLeft(secs);
      }
    };

    checkTimer();
    const interval = setInterval(checkTimer, 250);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && timerIsRunning && timerEndTimeRef.current) {
        checkTimer();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [timerIsRunning]);

  const toggleTimer = useCallback(() => {
    soundManager.playTimerTick();
    if (timerIsFinished) {
      const secs = timerTargetDuration;
      setTimerSecondsLeft(secs);
      setTimerIsFinished(false);
      timerEndTimeRef.current = Date.now() + secs * 1000;
      setTimerIsRunning(true);
      return;
    }

    if (timerIsRunning) {
      if (timerEndTimeRef.current) {
        const msLeft = timerEndTimeRef.current - Date.now();
        setTimerSecondsLeft(Math.max(0, Math.ceil(msLeft / 1000)));
      }
      timerEndTimeRef.current = null;
      setTimerIsRunning(false);
    } else {
      timerEndTimeRef.current = Date.now() + timerSecondsLeft * 1000;
      setTimerIsRunning(true);
    }
  }, [timerIsFinished, timerIsRunning, timerSecondsLeft, timerTargetDuration]);

  const resetTimer = useCallback(() => {
    soundManager.playTimerTick();
    timerEndTimeRef.current = null;
    setTimerIsRunning(false);
    setTimerIsFinished(false);
    setTimerSecondsLeft(timerTargetDuration);
  }, [timerTargetDuration]);

  const addTimerMinutes = useCallback((mins: number) => {
    soundManager.playTimerTick();
    const additionalSecs = mins * 60;
    if (timerIsFinished) {
      setTimerTargetDuration(additionalSecs);
      setTimerSecondsLeft(additionalSecs);
      timerEndTimeRef.current = Date.now() + additionalSecs * 1000;
    } else {
      setTimerTargetDuration(prev => prev + additionalSecs);
      setTimerSecondsLeft(prev => prev + additionalSecs);
      if (timerEndTimeRef.current) {
        timerEndTimeRef.current += additionalSecs * 1000;
      } else {
        timerEndTimeRef.current = Date.now() + (timerSecondsLeft + additionalSecs) * 1000;
      }
    }
    setTimerIsFinished(false);
    setTimerIsRunning(true);
  }, [timerIsFinished, timerSecondsLeft]);

  const setTimerPreset = useCallback((mins: number, presetMode: 'focus' | 'break' = 'focus') => {
    soundManager.playTimerTick();
    const secs = mins * 60;
    setTimerMode(presetMode);
    setTimerTargetDuration(secs);
    setTimerSecondsLeft(secs);
    setTimerIsFinished(false);
    timerEndTimeRef.current = Date.now() + secs * 1000;
    setTimerIsRunning(true);
  }, []);

  // Derive unblocked tasks matching today's criteria (both 'ready' and 'inbox' can be started in focus deck)
  const unblockedReadyTasks = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return tasks.filter(t => {
      // Must be ready or inbox status (in-progress tasks live in the dedicated Continue Later tray)
      if (t.status !== 'ready' && t.status !== 'inbox') return false;

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

  // Specific query for unblocked inbox tasks available to start in Focus Deck
  const unblockedInboxTasks = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return tasks.filter(t => {
      if (t.status !== 'inbox') return false;
      if (t.snoozedUntil && t.snoozedUntil.startsWith(today)) return false;
      const hasUnresolvedBlockers = t.blockers.some(b => !b.resolved);
      if (hasUnresolvedBlockers) return false;
      return true;
    });
  }, [tasks]);

  // Tasks in ready status
  const readyTasks = useMemo(() => {
    return tasks.filter(t => t.status === 'ready');
  }, [tasks]);

  // Tasks currently in progress or paused to continue later
  const inProgressTasks = useMemo(() => {
    return tasks.filter(t => t.status === 'in_progress');
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
        setTasks(prev => prev.map(t => {
          if (t.id === finalPick.id) {
            return { ...t, status: 'in_progress' as TaskStatus };
          }
          return t;
        }));
        setActiveTaskId(finalPick.id);
        setIsRolling(false);
        soundManager.playLandSound();

        // Auto-start Pomodoro timer for the selected task
        const mins = finalPick.estimatedMinutes || 25;
        const secs = mins * 60;
        setTimerTargetDuration(secs);
        setTimerSecondsLeft(secs);
        setTimerMode('focus');
        setTimerIsFinished(false);
        timerEndTimeRef.current = Date.now() + secs * 1000;
        setTimerIsRunning(true);
      }
    }, 90);
  }, [getEligibleRollPool, activeTaskId]);

  // Start a specific task directly (from Inbox, Ready deck, or Continue Later)
  const startTaskDirectly = useCallback((taskId: string) => {
    // If another task was active, save it in in_progress so it is never lost or forgotten
    if (activeTaskId && activeTaskId !== taskId) {
      setTasks(prev => prev.map(t => {
        if (t.id === activeTaskId && t.status !== 'completed') {
          return { ...t, status: 'in_progress' as TaskStatus };
        }
        return t;
      }));
    }
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return { ...t, status: 'in_progress' as TaskStatus };
      }
      return t;
    }));
    setActiveTaskId(taskId);
    soundManager.playLandSound();

    // Auto-start Pomodoro timer for this task
    const targetTask = tasks.find(t => t.id === taskId);
    const mins = targetTask?.estimatedMinutes || 25;
    const secs = mins * 60;
    setTimerTargetDuration(secs);
    setTimerSecondsLeft(secs);
    setTimerMode('focus');
    setTimerIsFinished(false);
    timerEndTimeRef.current = Date.now() + secs * 1000;
    setTimerIsRunning(true);
  }, [activeTaskId, tasks]);

  // Pause active task or specific task to continue later
  const continueTaskLater = useCallback((taskId?: string) => {
    const targetId = taskId || activeTaskId;
    if (!targetId) return;
    soundManager.playSkipSound();
    setTasks(prev => prev.map(t => {
      if (t.id === targetId) {
        return {
          ...t,
          status: 'in_progress' as TaskStatus
        };
      }
      return t;
    }));
    if (activeTaskId === targetId) {
      setActiveTaskId(null);
      setTimerIsRunning(false);
      timerEndTimeRef.current = null;
    }
  }, [activeTaskId]);

  // Resume a task that was paused to continue later
  const resumeTask = useCallback((taskId: string) => {
    startTaskDirectly(taskId);
  }, [startTaskDirectly]);

  // Move task back to the Ready roulette pool
  const moveToReadyPool = useCallback((taskId: string) => {
    soundManager.playTimerTick();
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return { 
          ...t, 
          status: 'ready' as TaskStatus,
          completedAt: undefined,
          nextDueDate: undefined,
          microSteps: t.microSteps ? t.microSteps.map(s => ({ ...s, completed: false })) : []
        };
      }
      return t;
    }));
    if (activeTaskId === taskId) {
      setActiveTaskId(null);
    }
  }, [activeTaskId]);

  // Move task back to Inbox
  const moveToInbox = useCallback((taskId: string) => {
    soundManager.playSkipSound();
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return { ...t, status: 'inbox' as TaskStatus };
      }
      return t;
    }));
    if (activeTaskId === taskId) {
      setActiveTaskId(null);
    }
  }, [activeTaskId]);

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

    setTasks(prev => {
      const updated = prev.map(t => {
        if (t.id === activeTask.id) {
          if (t.recurrence && t.recurrence !== 'none') {
            const nextDue = calculateNextDueDate(t.recurrence);
            return {
              ...t,
              status: 'completed' as TaskStatus,
              completedAt: new Date().toISOString(),
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
      });

      // Automatically unblock tasks that were waiting for this task!
      return unblockDependentTasks(activeTask.id, updated);
    });

    setActiveTaskId(null);
    setTimerIsRunning(false);
    timerEndTimeRef.current = null;
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
    setTimerIsRunning(false);
    timerEndTimeRef.current = null;
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
        const updated = prev.map(t => t.id === taskData.id ? { ...t, ...taskData } : t);
        if (taskData.status === 'completed' && taskData.id) {
          return unblockDependentTasks(taskData.id, updated);
        }
        return updated;
      } else {
        const newTask: Task = {
          id: generateId(),
          title: taskData.title,
          definitionOfDone: taskData.definitionOfDone || '',
          notes: taskData.notes || '',
          status: (taskData.status || 'ready') as TaskStatus,
          importance: taskData.importance || 'medium',
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
    setTasks(prev => {
      const remaining = prev.filter(t => t.id !== id);
      return unblockDependentTasks(id, remaining);
    });
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
        continueTaskLater,
        resumeTask,
        moveToReadyPool,
        moveToInbox,
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
        unblockedInboxTasks,
        readyTasks,
        inProgressTasks,
        inboxTasks,
        completedTodayCount,
        coldStorageTasks,
        timerSecondsLeft,
        timerTargetDuration,
        timerIsRunning,
        timerMode,
        timerIsFinished,
        toggleTimer,
        resetTimer,
        addTimerMinutes,
        setTimerPreset
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

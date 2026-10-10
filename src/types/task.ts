export type EnergyLevel = 'low' | 'medium' | 'high';

export type TaskStatus = 
  | 'inbox'         // Just captured, not yet SMART-ified
  | 'ready'         // Unblocked, ready for roulette
  | 'in_progress'   // Currently picked on the HUD
  | 'completed'     // Finished!
  | 'snoozed'       // Snoozed for the rest of today
  | 'blocked'       // Has active blockers preventing execution
  | 'cold_storage'; // Archived to prevent task rot/guilt

export interface MicroStep {
  id: string;
  title: string;
  completed: boolean;
}

export interface Blocker {
  id: string;
  text: string;
  resolved: boolean;
  blockedByTaskId?: string;
}

export interface Task {
  id: string;
  title: string;
  definitionOfDone?: string; // "I am finished when [X] is done"
  notes?: string;
  status: TaskStatus;
  energyLevel: EnergyLevel; // 'low' (quick/easy), 'medium' (standard), 'high' (deep focus)
  estimatedMinutes: number; // 5, 15, 30, 60...
  microSteps: MicroStep[];
  blockers: Blocker[];
  frictionBusterStep?: string; // 2-minute starter step
  skipCount: number;
  lastSkippedReason?: 'too_tired' | 'blocked' | 'not_now' | 'other';
  snoozedUntil?: string; // ISO date string
  createdAt: string;     // ISO date string
  completedAt?: string;   // ISO date string
  archivedAt?: string;    // ISO date string
}

export type RouletteFilter = 'all' | 'low_energy' | 'deep_focus' | 'quick_win';

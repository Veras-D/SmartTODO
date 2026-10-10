export type EnergyLevel = 'low' | 'medium' | 'high';

export type TaskStatus = 
  | 'inbox'         // Captured raw thought, waiting for GTD processing or direct start
  | 'ready'         // Clarified and ready for the roulette
  | 'in_progress'   // Currently active on the Focus HUD
  | 'completed'     // Finished!
  | 'snoozed'       // Snoozed for today
  | 'blocked'       // Has active blockers / Waiting For
  | 'cold_storage'; // Archived

export type GTDContext = '@computer' | '@phone' | '@errands' | '@home' | '@anywhere';

export type RecurrenceInterval = 'none' | 'daily' | 'every_2_days' | 'weekly' | 'monthly';

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
  nextAction?: string;        // GTD: Next physical actionable step
  gtdContext?: GTDContext;    // GTD Context (@computer, @phone, etc.)
  desiredOutcome?: string;    // GTD: Desired outcome / definition of done
  definitionOfDone?: string;
  notes?: string;
  status: TaskStatus;
  energyLevel: EnergyLevel;   // Low / Med / High spoon
  estimatedMinutes: number;   // 5, 15, 25, 45...
  microSteps: MicroStep[];
  blockers: Blocker[];
  frictionBusterStep?: string; // 2-minute starter step
  skipCount: number;
  lastSkippedReason?: 'too_tired' | 'blocked' | 'not_now' | 'other';
  snoozedUntil?: string;
  recurrence?: RecurrenceInterval; // 'none' | 'daily' | 'every_2_days' | 'weekly' | 'monthly'
  nextDueDate?: string;            // YYYY-MM-DD
  lastCompletedAt?: string;
  createdAt: string;
  completedAt?: string;
  archivedAt?: string;
}

export type RouletteFilter = 'all' | 'low_energy' | 'deep_focus' | 'quick_win';

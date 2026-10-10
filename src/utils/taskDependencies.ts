import { Task } from '../types/task';

/**
 * Returns all task IDs that are directly or transitively blocked by `targetTaskId`.
 * In other words, tasks that depend on targetTaskId completing first.
 */
export function getTransitiveBlockedTaskIds(targetTaskId: string, allTasks: Task[]): Set<string> {
  const blockedIds = new Set<string>();
  const queue: string[] = [targetTaskId];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    for (const task of allTasks) {
      if (!blockedIds.has(task.id) && task.id !== targetTaskId) {
        const isBlockedByCurrent = task.blockers.some(
          b => !b.resolved && b.blockedByTaskId === currentId
        );
        if (isBlockedByCurrent) {
          blockedIds.add(task.id);
          queue.push(task.id);
        }
      }
    }
  }

  return blockedIds;
}

/**
 * Returns candidate tasks that can legitimately block `targetTask`.
 * Enforces DAG (Directed Acyclic Graph) rules:
 * 1. Cannot block self (A cannot block A)
 * 2. Cannot be completed or archived
 * 3. Cannot be already an active blocker of targetTask
 * 4. Cannot be already transitively blocked by targetTask (A blocks C => C cannot block A)
 */
export function getEligibleBlockerCandidates(targetTask: Task, allTasks: Task[]): Task[] {
  const transitivelyBlockedByTarget = getTransitiveBlockedTaskIds(targetTask.id, allTasks);
  const existingBlockerTaskIds = new Set(
    targetTask.blockers
      .filter(b => b.blockedByTaskId && !b.resolved)
      .map(b => b.blockedByTaskId!)
  );

  return allTasks.filter(candidate => {
    if (candidate.id === targetTask.id) return false;
    if (candidate.status === 'completed') return false;
    if (candidate.status === 'cold_storage') return false;
    if (existingBlockerTaskIds.has(candidate.id)) return false;
    if (transitivelyBlockedByTarget.has(candidate.id)) return false;
    return true;
  });
}

/**
 * Given a completed taskId, resolves all blockers referencing it across all tasks,
 * and automatically transitions any task that is no longer blocked from 'blocked' to 'ready'.
 */
export function unblockDependentTasks(completedTaskId: string, allTasks: Task[]): Task[] {
  return allTasks.map(task => {
    // Check if this task has blockers referencing completedTaskId
    const hasDependency = task.blockers.some(b => b.blockedByTaskId === completedTaskId && !b.resolved);
    if (!hasDependency) return task;

    const updatedBlockers = task.blockers.map(b => {
      if (b.blockedByTaskId === completedTaskId) {
        return { ...b, resolved: true };
      }
      return b;
    });

    const hasOtherUnresolved = updatedBlockers.some(b => !b.resolved);
    const newStatus = (task.status === 'blocked' && !hasOtherUnresolved) ? 'ready' : task.status;

    return {
      ...task,
      blockers: updatedBlockers,
      status: newStatus
    };
  });
}

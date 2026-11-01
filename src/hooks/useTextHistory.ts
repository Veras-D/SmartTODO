import { useCallback, useEffect, useRef } from 'react';
import type React from 'react';

interface Snapshot {
  value: string;
  caret: number;
}

interface UseTextHistoryOptions {
  /** Minimum ms between recorded steps while typing continuously. */
  stepMs?: number;
  /** Maximum number of undo steps kept per field. */
  limit?: number;
  /** The input/textarea, used to restore focus and caret after undo/redo. */
  inputRef?: React.RefObject<HTMLTextAreaElement | HTMLInputElement | null>;
}

const readCaret = (
  element: HTMLTextAreaElement | HTMLInputElement | null | undefined,
  fallback: number
): number => {
  if (!element) return fallback;
  const position = element.selectionStart ?? fallback;
  return Math.min(position, fallback);
};

/**
 * Text-level undo/redo for controlled inputs.
 *
 * React controlled inputs keep overwriting `value`, which wipes the webview's
 * native undo stack, so Ctrl+Z does nothing inside them. This hook records its
 * own snapshots (grouped so a burst of typing is one step) and restores the
 * value plus caret position.
 */
export function useTextHistory(
  value: string,
  onChange: (next: string) => void,
  options: UseTextHistoryOptions = {}
) {
  const { stepMs = 450, limit = 200, inputRef } = options;

  const undoStack = useRef<Snapshot[]>([]);
  const redoStack = useRef<Snapshot[]>([]);
  const lastValue = useRef(value);
  const lastStepAt = useRef(0);

  // Record a step whenever the value changes, but not on every keystroke
  useEffect(() => {
    if (value === lastValue.current) return;

    const previous = lastValue.current;
    const now = Date.now();
    const caret = readCaret(inputRef?.current, previous.length);
    const isJump = Math.abs(value.length - previous.length) > 20;

    if (isJump || now - lastStepAt.current >= stepMs) {
      undoStack.current.push({ value: previous, caret });
      if (undoStack.current.length > limit) undoStack.current.shift();
      lastStepAt.current = now;
    }

    // A fresh edit invalidates the redo branch
    redoStack.current = [];
    lastValue.current = value;
  }, [value, stepMs, limit, inputRef]);

  const restore = useCallback((snapshot: Snapshot) => {
    lastValue.current = snapshot.value;
    lastStepAt.current = 0;
    onChange(snapshot.value);
    const element = inputRef?.current;
    if (!element) return;

    // Wait for React to paint the restored value before moving the caret
    requestAnimationFrame(() => {
      const position = Math.min(snapshot.caret, snapshot.value.length);
      element.focus();
      element.setSelectionRange(position, position);
    });
  }, [onChange, inputRef]);

  const undo = useCallback((): boolean => {
    const snapshot = undoStack.current.pop();
    if (!snapshot) return false;

    const current = lastValue.current;
    redoStack.current.push({
      value: current,
      caret: readCaret(inputRef?.current, current.length)
    });
    restore(snapshot);
    return true;
  }, [restore, inputRef]);

  const redo = useCallback((): boolean => {
    const snapshot = redoStack.current.pop();
    if (!snapshot) return false;

    const current = lastValue.current;
    undoStack.current.push({
      value: current,
      caret: readCaret(inputRef?.current, current.length)
    });
    restore(snapshot);
    return true;
  }, [restore, inputRef]);

  /** Forget the history, e.g. when the field is switched to another record. */
  const reset = useCallback((next: string) => {
    undoStack.current = [];
    redoStack.current = [];
    lastValue.current = next;
    lastStepAt.current = 0;
  }, []);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (!(event.ctrlKey || event.metaKey) || event.altKey) return;

      const key = event.key.toLowerCase();
      if (key === 'z') {
        event.preventDefault();
        if (event.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if (key === 'y') {
        event.preventDefault();
        redo();
      }
    },
    [undo, redo]
  );

  return {
    handleKeyDown,
    undo,
    redo,
    reset,
    canUndo: () => undoStack.current.length > 0,
    canRedo: () => redoStack.current.length > 0
  };
}

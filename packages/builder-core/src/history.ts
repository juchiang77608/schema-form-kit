/**
 * Immutable undo/redo history.
 *
 * Consecutive commits with the same `coalesceKey` (for example typing in the
 * label of one field) collapse into a single undo step, so one undo reverts
 * the whole edit instead of one character.
 */
export interface History<T> {
  past: T[];
  present: T;
  future: T[];
  /** Key of the last commit, used for coalescing. */
  lastKey?: string;
  limit: number;
}

export function createHistory<T>(initial: T, limit = 100): History<T> {
  return { past: [], present: initial, future: [], limit };
}

export interface CommitOptions {
  /** Commits with the same key in a row are merged into one undo step. */
  coalesceKey?: string;
}

export function commit<T>(history: History<T>, next: T, options: CommitOptions = {}): History<T> {
  if (Object.is(next, history.present)) return history;
  const { coalesceKey } = options;
  const merge = coalesceKey !== undefined && coalesceKey === history.lastKey;
  const past = merge ? history.past : [...history.past, history.present].slice(-history.limit);
  return { past, present: next, future: [], lastKey: coalesceKey, limit: history.limit };
}

export function undo<T>(history: History<T>): History<T> {
  const previous = history.past.at(-1);
  if (previous === undefined) return history;
  return {
    past: history.past.slice(0, -1),
    present: previous,
    future: [history.present, ...history.future],
    limit: history.limit,
  };
}

export function redo<T>(history: History<T>): History<T> {
  const [next, ...rest] = history.future;
  if (next === undefined) return history;
  return {
    past: [...history.past, history.present],
    present: next,
    future: rest,
    limit: history.limit,
  };
}

export const canUndo = <T>(history: History<T>): boolean => history.past.length > 0;
export const canRedo = <T>(history: History<T>): boolean => history.future.length > 0;

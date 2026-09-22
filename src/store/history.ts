import { CanvasNode } from '../types/builder';
import { useBuilderStore } from './useBuilderStore';

interface HistorySnapshot {
  tree: CanvasNode;
  rootId: string;
}

const MAX_HISTORY = 30;
let undoStack: HistorySnapshot[] = [];
let redoStack: HistorySnapshot[] = [];
let isApplyingHistory = false;

// Helper to deep clone tree
function cloneTree(node: CanvasNode): CanvasNode {
  return JSON.parse(JSON.stringify(node));
}

export function recordSnapshot() {
  if (isApplyingHistory) return;
  const state = useBuilderStore.getState();
  if (!state.tree || !state.rootId) return;

  undoStack.push({
    tree: cloneTree(state.tree),
    rootId: state.rootId,
  });

  if (undoStack.length > MAX_HISTORY) {
    undoStack.shift();
  }

  // Clear redo stack on new action
  redoStack = [];
}

export function undo(): boolean {
  if (undoStack.length === 0) return false;

  const state = useBuilderStore.getState();
  if (state.tree && state.rootId) {
    redoStack.push({
      tree: cloneTree(state.tree),
      rootId: state.rootId,
    });
  }

  const previous = undoStack.pop();
  if (!previous) return false;

  isApplyingHistory = true;
  useBuilderStore.getState().loadTree(previous.tree, previous.rootId);
  isApplyingHistory = false;
  return true;
}

export function redo(): boolean {
  if (redoStack.length === 0) return false;

  const state = useBuilderStore.getState();
  if (state.tree && state.rootId) {
    undoStack.push({
      tree: cloneTree(state.tree),
      rootId: state.rootId,
    });
  }

  const next = redoStack.pop();
  if (!next) return false;

  isApplyingHistory = true;
  useBuilderStore.getState().loadTree(next.tree, next.rootId);
  isApplyingHistory = false;
  return true;
}

export function canUndo(): boolean {
  return undoStack.length > 0;
}

export function canRedo(): boolean {
  return redoStack.length > 0;
}

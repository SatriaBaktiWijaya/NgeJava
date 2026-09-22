import { useState, useEffect, useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { Toolbar } from './components/Toolbar';
import { SplitPane } from './components/SplitPane';
import { Palette } from './components/Palette';
import { Canvas } from './components/Canvas';
import { PropertyInspector } from './components/PropertyInspector';
import { MonacoPanel } from './components/MonacoPanel';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useBuilderStore } from './store/useBuilderStore';
import { undo, redo, canUndo, canRedo } from './store/history';
import { 
  saveJavaFile, 
  saveProjectState, 
  loadProjectState, 
  getAppConfig, 
  setAppConfig 
} from './ipc/tauriBridge';
import { CanvasNode } from './types/builder';

function findNodeInTree(root: CanvasNode | null, id: string): CanvasNode | null {
  if (!root) return null;
  if (root.id === id) return root;
  for (const child of root.children) {
    const found = findNodeInTree(child, id);
    if (found) return found;
  }
  return null;
}

export function App() {
  const [splitRatio, setSplitRatio] = useState<number>(0.58);
  const [notification, setNotification] = useState<{ message: string; type: 'info' | 'error' | 'success' } | null>(null);

  const generatedCode = useBuilderStore((s) => s.generatedCode);
  const addComponent = useBuilderStore((s) => s.addComponent);
  const moveComponent = useBuilderStore((s) => s.moveComponent);
  const removeComponent = useBuilderStore((s) => s.removeComponent);
  const selectedComponentId = useBuilderStore((s) => s.selectedComponentId);
  const codeLineMap = useBuilderStore((s) => s.codeLineMap);
  const rootId = useBuilderStore((s) => s.rootId);
  const tree = useBuilderStore((s) => s.tree);
  const loadTree = useBuilderStore((s) => s.loadTree);

  const selectedLineRange = selectedComponentId ? codeLineMap[selectedComponentId] : null;

  // Show transient notification toast
  const showToast = useCallback((message: string, type: 'info' | 'error' | 'success' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  }, []);

  // Load app config (split ratio) on mount
  useEffect(() => {
    getAppConfig().then((cfg) => {
      if (cfg && cfg.splitPaneRatio) {
        setSplitRatio(cfg.splitPaneRatio);
      }
    });
  }, []);

  // Save split ratio when changed
  const handleSplitRatioChange = (ratio: number) => {
    setSplitRatio(ratio);
    setAppConfig({
      splitPaneRatio: ratio,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
    });
  };

  // Export Java source file (IPC-1)
  const handleExportJava = async () => {
    if (!generatedCode) return;
    const res = await saveJavaFile({
      suggestedFileName: 'GeneratedForm.java',
      content: generatedCode,
    });
    if (res.success) {
      showToast('Java code exported successfully!', 'success');
    } else if (res.error) {
      showToast(`Export failed: ${res.error}`, 'error');
    }
  };

  // Save Project State JSON (IPC-2)
  const handleSaveProject = async () => {
    if (!tree || !rootId) return;
    const res = await saveProjectState({
      suggestedFileName: 'MyForm.jforge.json',
      projectState: {
        schemaVersion: 1,
        rootId,
        tree,
      },
    });
    if (res.success) {
      showToast('Project saved successfully!', 'success');
    } else if (res.error) {
      showToast(`Save failed: ${res.error}`, 'error');
    }
  };

  // Load Project State JSON (IPC-3)
  const handleLoadProject = async () => {
    const res = await loadProjectState();
    if (res.success && res.projectState) {
      loadTree(res.projectState.tree, res.projectState.rootId);
      showToast('Project loaded successfully!', 'success');
    } else if (res.error) {
      // Non-blocking error notification (NFR-REL-1)
      showToast(`Failed to load project: ${res.error}`, 'error');
    }
  };

  // Undo / Redo handlers
  const handleUndo = () => {
    if (undo()) {
      showToast('Undone', 'info');
    }
  };

  const handleRedo = () => {
    if (redo()) {
      showToast('Redone', 'info');
    }
  };

  // Sensors for DnD
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 4,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over, delta } = event;
    if (!active) return;

    const activeId = String(active.id);

    // Case 1: Palette drop onto container
    if (activeId.startsWith('palette:')) {
      const componentType = activeId.replace('palette:', '');
      const targetId = over ? String(over.id) : (rootId || '');
      if (!targetId) return;

      let dropX = 40;
      let dropY = 40;

      if (over && over.rect) {
        const translatedRect = active.rect.current.translated;
        if (translatedRect) {
          dropX = Math.max(10, Math.round(translatedRect.left - over.rect.left));
          dropY = Math.max(10, Math.round(translatedRect.top - over.rect.top));
        }
      }

      addComponent(targetId, componentType, { x: dropX, y: dropY });
      return;
    }

    // Case 2: Reposition existing canvas node
    if (tree && !activeId.startsWith('palette:')) {
      const node = findNodeInTree(tree, activeId);
      if (node && node.layout) {
        const newX = Math.max(0, Math.round(node.layout.x + delta.x));
        const newY = Math.max(0, Math.round(node.layout.y + delta.y));
        moveComponent(activeId, newX, newY);
      }
    }
  };

  // Keyboard Shortcuts: Delete, Undo (Ctrl+Z), Redo (Ctrl+Y), Export (Ctrl+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      const isInput = activeTag === 'input' || activeTag === 'textarea';

      // Delete selected
      if (!isInput && (e.key === 'Delete' || e.key === 'Backspace') && selectedComponentId) {
        if (selectedComponentId !== rootId) {
          e.preventDefault();
          removeComponent(selectedComponentId);
        }
      }

      // Ctrl/Cmd + Z (Undo)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }

      // Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z (Redo)
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))
      ) {
        e.preventDefault();
        handleRedo();
      }

      // Ctrl/Cmd + S (Save / Export)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleExportJava();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#181818] text-[#cccccc]">
      <Toolbar
        onExportJava={handleExportJava}
        onSaveProject={handleSaveProject}
        onLoadProject={handleLoadProject}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onDelete={() => {
          if (selectedComponentId && selectedComponentId !== rootId) {
            removeComponent(selectedComponentId);
          }
        }}
        canUndo={canUndo()}
        canRedo={canRedo()}
      />

      {/* Toast Notification Banner */}
      {notification && (
        <div
          className={`absolute top-12 right-6 z-50 px-3.5 py-2 rounded shadow-lg text-xs font-medium flex items-center gap-2 border transition-all animate-in fade-in ${
            notification.type === 'error'
              ? 'bg-rose-950/90 border-rose-600 text-rose-200'
              : notification.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-600 text-emerald-200'
              : 'bg-[#2d2d2d]/95 border-[#007acc] text-white'
          }`}
        >
          <span>{notification.message}</span>
        </div>
      )}

      <div className="flex-1 w-full overflow-hidden">
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <SplitPane
            defaultRatio={splitRatio}
            onRatioChange={handleSplitRatioChange}
            left={
              <ErrorBoundary fallbackTitle="Visual Builder Error">
                <div className="flex h-full w-full overflow-hidden relative">
                  {/* Region 1: Palette */}
                  <Palette />

                  {/* Region 2: Canvas */}
                  <Canvas />

                  {/* Region 3: Property Inspector */}
                  <PropertyInspector />
                </div>
              </ErrorBoundary>
            }
            right={
              /* Region 4: Monaco Code Editor with Error Boundary */
              <ErrorBoundary fallbackTitle="Monaco Editor Error">
                <MonacoPanel
                  code={generatedCode || '// Java code will be generated here'}
                  selectedLineRange={selectedLineRange}
                  onCopy={() => showToast('Java code copied to clipboard!', 'success')}
                />
              </ErrorBoundary>
            }
          />
        </DndContext>
      </div>

      <footer className="h-5 bg-[#007acc] text-white flex items-center justify-between px-3 text-[11px] select-none shrink-0 font-sans">
        <div className="flex items-center gap-3">
          <span>Ready</span>
          <span>•</span>
          <span>
            Selected: <span className="font-mono font-bold">{selectedComponentId || 'None'}</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span>Split: {Math.round(splitRatio * 100)}% / {Math.round((1 - splitRatio) * 100)}%</span>
          <span>UTF-8</span>
          <span>LF</span>
        </div>
      </footer>
    </div>
  );
}

export default App;

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useBuilderStore } from '../store/useBuilderStore';
import { CanvasNodeView } from './CanvasNodeView';

export const Canvas: React.FC = () => {
  const tree = useBuilderStore((s) => s.tree);
  const rootId = useBuilderStore((s) => s.rootId);
  const selectedComponentId = useBuilderStore((s) => s.selectedComponentId);
  const selectComponent = useBuilderStore((s) => s.selectComponent);

  const { setNodeRef, isOver } = useDroppable({
    id: rootId || 'frame-root',
    data: { id: rootId, type: 'JFrame' },
  });

  if (!tree || !rootId) {
    return (
      <div className="flex-1 h-full bg-[#0c0c0e] flex items-center justify-center text-muted-foreground text-xs font-mono">
        No active JFrame
      </div>
    );
  }

  const title = String(tree.props.title || 'GeneratedForm');
  const width = Number(tree.props.width || 520);
  const height = Number(tree.props.height || 380);
  const isRootSelected = selectedComponentId === rootId;

  const handleFrameClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectComponent(rootId);
  };

  return (
    <div className="flex-1 h-full bg-[#0c0c0e] flex flex-col min-w-[400px] overflow-hidden relative select-none">
      {/* Canvas Top Bar */}
      <div className="h-10 px-3 border-b border-border flex items-center justify-between text-xs shrink-0 bg-background">
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground tracking-tight">Form Designer</span>
          <span className="text-[10px] font-mono text-muted-foreground">null layout</span>
        </div>

        <div className="text-[10px] font-mono text-muted-foreground">
          {width} × {height} px
        </div>
      </div>

      {/* Canvas Workspace with Micro-Dot Grid */}
      <div
        className="flex-1 overflow-auto p-8 relative flex items-center justify-center bg-[#0c0c0e]"
        onClick={() => selectComponent(null)}
        style={{
          backgroundImage: 'radial-gradient(#1f1f23 1px, transparent 1px)',
          backgroundSize: '16px 16px',
        }}
      >
        {/* Faux-OS Window Chrome */}
        <div
          onClick={handleFrameClick}
          style={{ width: `${width}px`, height: `${height}px` }}
          className={`rounded-[6px] border flex flex-col relative transition-all duration-150 overflow-hidden shadow-micro ${
            isRootSelected
              ? 'border-foreground/80 ring-1 ring-foreground/20'
              : 'border-border hover:border-foreground/30'
          }`}
        >
          {/* Window Top Bar with Three Subtle Dots */}
          <div className="h-7 bg-[#1c1c1f] border-b border-[#2a2a2e] px-3 flex items-center justify-between text-xs text-foreground shrink-0 cursor-default">
            <div className="flex items-center gap-1.5 opacity-60">
              <div className="w-2 h-2 rounded-full bg-[#4a4a50]" />
              <div className="w-2 h-2 rounded-full bg-[#4a4a50]" />
              <div className="w-2 h-2 rounded-full bg-[#4a4a50]" />
            </div>

            <div className="text-[11px] font-normal truncate max-w-[240px] text-zinc-300">
              {title}
            </div>

            <div className="w-8" />
          </div>

          {/* Droppable Swing Surface */}
          <div
            ref={setNodeRef}
            className={`flex-1 relative overflow-hidden transition-colors ${
              isOver ? 'bg-[#ece9d8]/90 ring-1 ring-inset ring-foreground/30' : 'bg-[#ece9d8]'
            }`}
          >
            {tree.children.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-zinc-500 pointer-events-none select-none">
                <p className="font-normal text-zinc-600 text-xs font-mono">Empty Frame</p>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Drag Swing components from palette or click +
                </p>
              </div>
            )}

            {/* Render children nodes */}
            {tree.children.map((child) => (
              <CanvasNodeView key={child.id} node={child} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { LayoutTemplate, Sparkles, Monitor } from 'lucide-react';
import { useBuilderStore } from '../store/useBuilderStore';
import { CanvasNodeView } from './CanvasNodeView';
import { Badge } from './ui/badge';

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
      <div className="flex-1 h-full bg-[#121214] flex items-center justify-center text-muted-foreground text-xs">
        No active JFrame. Add a JFrame to start building.
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
    <div className="flex-1 h-full bg-[#0f0f11] flex flex-col min-w-[400px] overflow-hidden relative select-none">
      {/* Canvas Top Bar */}
      <div className="h-10 px-3.5 border-b border-border flex items-center justify-between text-xs bg-muted/20 shrink-0">
        <div className="flex items-center gap-2">
          <LayoutTemplate className="w-3.5 h-3.5 text-primary" />
          <span className="font-semibold text-foreground/90">Canvas</span>
          <Badge variant="outline" className="text-[10px] px-1.5 h-4 font-mono font-normal text-muted-foreground border-border/80">
            Absolute Layout
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-[10px] px-2 h-4 font-mono font-normal">
            <Monitor className="w-3 h-3 mr-1 text-muted-foreground" />
            {width} × {height} px
          </Badge>
        </div>
      </div>

      {/* Canvas Work Area with Subtle Grid */}
      <div
        className="flex-1 overflow-auto p-8 relative flex items-center justify-center bg-[#0d0d0f]"
        onClick={() => selectComponent(null)}
        style={{
          backgroundImage: 'radial-gradient(#27272a 1px, transparent 1px)',
          backgroundSize: '18px 18px',
        }}
      >
        {/* Render JFrame Window Shell */}
        <div
          onClick={handleFrameClick}
          style={{ width: `${width}px`, height: `${height}px` }}
          className={`rounded-lg shadow-2xl border flex flex-col relative transition-all duration-150 overflow-hidden ${
            isRootSelected
              ? 'border-primary ring-2 ring-primary/40 shadow-primary/10'
              : 'border-[#3f3f46] hover:border-[#52525b]'
          }`}
        >
          {/* JFrame Title Bar */}
          <div className="h-8 bg-[#27272a] border-b border-[#3f3f46] px-3 flex items-center justify-between text-xs text-foreground shrink-0 cursor-default">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs" />
              <span className="font-medium text-xs truncate max-w-[260px] text-zinc-200">{title}</span>
            </div>
            <div className="flex items-center gap-1.5 opacity-60">
              <div className="w-2.5 h-2.5 rounded-xs bg-zinc-500" />
              <div className="w-2.5 h-2.5 rounded-xs bg-zinc-500" />
              <div className="w-2.5 h-2.5 rounded-xs bg-rose-500" />
            </div>
          </div>

          {/* JFrame Canvas Area (Droppable) */}
          <div
            ref={setNodeRef}
            className={`flex-1 relative overflow-hidden transition-colors ${
              isOver ? 'bg-[#f4f2e9] ring-2 ring-inset ring-primary/50' : 'bg-[#ece9d8]'
            }`}
          >
            {tree.children.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-zinc-500 pointer-events-none select-none">
                <Sparkles className="w-7 h-7 text-amber-500 mb-2 opacity-80" />
                <p className="font-semibold text-zinc-700 text-xs">Canvas Surface Ready</p>
                <p className="text-[11px] text-zinc-500 mt-1 max-w-xs leading-relaxed">
                  Drag Swing components from the palette or click '+' to start designing your GUI.
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

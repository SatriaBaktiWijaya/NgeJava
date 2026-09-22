import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { LayoutTemplate, Sparkles } from 'lucide-react';
import { useBuilderStore } from '../store/useBuilderStore';
import { CanvasNodeView } from './CanvasNodeView';

export const Canvas: React.FC = () => {
  const tree = useBuilderStore((s) => s.tree);
  const rootId = useBuilderStore((s) => s.rootId);
  const selectedComponentId = useBuilderStore((s) => s.selectedComponentId);
  const selectComponent = useBuilderStore((s) => s.selectComponent);

  // Droppable root target
  const { setNodeRef, isOver } = useDroppable({
    id: rootId || 'frame-root',
    data: { id: rootId, type: 'JFrame' },
  });

  if (!tree || !rootId) {
    return (
      <div className="flex-1 h-full bg-[#141414] flex items-center justify-center text-gray-500">
        No active JFrame. Create a JFrame to start building.
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
    <div className="flex-1 h-full bg-[#181818] flex flex-col min-w-[400px] overflow-hidden relative select-none">
      {/* Canvas Top Bar */}
      <div className="h-9 px-3 border-b border-[#333333] flex items-center justify-between text-xs text-[#bbbbbb] bg-[#202020] shrink-0">
        <div className="flex items-center gap-2">
          <LayoutTemplate className="w-3.5 h-3.5 text-sky-400" />
          <span className="font-semibold text-[#e1e1e1]">Visual GUI Builder</span>
          <span className="text-[11px] text-[#777777]">• Absolute Layout (null)</span>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-[#888888]">
          <span>Frame: {width} × {height}px</span>
        </div>
      </div>

      {/* Canvas Work Area with Dot Grid */}
      <div
        className="flex-1 overflow-auto p-8 relative flex items-center justify-center bg-[#141414]"
        onClick={() => selectComponent(null)}
        style={{
          backgroundImage: 'radial-gradient(#2d2d2d 1px, transparent 1px)',
          backgroundSize: '16px 16px',
        }}
      >
        {/* Render JFrame Window */}
        <div
          onClick={handleFrameClick}
          style={{ width: `${width}px`, height: `${height}px` }}
          className={`bg-[#2d2d2d] rounded-t-md shadow-2xl border flex flex-col relative transition-shadow ${
            isRootSelected
              ? 'border-[#007acc] ring-1 ring-[#007acc]'
              : 'border-[#444444]'
          }`}
        >
          {/* JFrame Window Title Bar */}
          <div className="h-8 bg-[#383838] border-b border-[#484848] px-3 flex items-center justify-between text-xs text-[#e1e1e1] rounded-t-md shrink-0 cursor-default">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="font-medium text-xs truncate max-w-[280px]">{title}</span>
            </div>
            <div className="flex items-center gap-1.5 opacity-70">
              <div className="w-2.5 h-2.5 rounded-sm bg-[#666666]" />
              <div className="w-2.5 h-2.5 rounded-sm bg-[#666666]" />
              <div className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
            </div>
          </div>

          {/* JFrame Content Pane (Droppable target) */}
          <div
            ref={setNodeRef}
            className={`flex-1 relative overflow-hidden transition-colors ${
              isOver ? 'bg-[#ece9d8]/90 ring-2 ring-inset ring-[#007acc]' : 'bg-[#ece9d8]'
            }`}
          >
            {tree.children.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-gray-500 pointer-events-none">
                <Sparkles className="w-7 h-7 text-amber-500 mb-2 opacity-80" />
                <p className="font-semibold text-gray-700 text-xs">Empty Canvas Surface</p>
                <p className="text-[11px] text-gray-500 mt-1 max-w-xs">
                  Drag Swing components from the palette on the left and drop them here.
                </p>
              </div>
            )}

            {/* Render direct child components */}
            {tree.children.map((child) => (
              <CanvasNodeView key={child.id} node={child} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useRef } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CanvasNode } from '../types/builder';
import { useBuilderStore } from '../store/useBuilderStore';

interface CanvasNodeViewProps {
  node: CanvasNode;
  isDarkPreview?: boolean;
}

export const CanvasNodeView: React.FC<CanvasNodeViewProps> = ({ node, isDarkPreview = true }) => {
  const selectedComponentId = useBuilderStore((s) => s.selectedComponentId);
  const selectComponent = useBuilderStore((s) => s.selectComponent);
  const resizeComponent = useBuilderStore((s) => s.resizeComponent);

  const isSelected = selectedComponentId === node.id;
  const isContainer = node.type === 'JPanel';

  // Draggable for repositioning
  const {
    attributes,
    listeners,
    setNodeRef: setDraggableRef,
    transform,
    isDragging,
  } = useDraggable({
    id: node.id,
    data: { type: node.type, id: node.id, isExisting: true },
  });

  // Droppable if this node is a container (JPanel)
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: node.id,
    disabled: !isContainer,
    data: { id: node.id, type: node.type },
  });

  // Combine refs
  const combineRefs = (element: HTMLDivElement | null) => {
    setDraggableRef(element);
    if (isContainer) {
      setDroppableRef(element);
    }
  };

  const layout = node.layout || { x: 0, y: 0, width: 100, height: 30 };

  // Calculate drag offset locally (does not touch Zustand store during active drag!)
  const currentX = layout.x + (transform?.x ?? 0);
  const currentY = layout.y + (transform?.y ?? 0);

  // Resize handling via local mouse events on the resize handle
  const resizeStartRef = useRef<{ startX: number; startY: number; startW: number; startH: number } | null>(null);

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    resizeStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startW: layout.width,
      startH: layout.height,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!resizeStartRef.current) return;
      const deltaX = moveEvent.clientX - resizeStartRef.current.startX;
      const deltaY = moveEvent.clientY - resizeStartRef.current.startY;
      const newW = Math.max(20, resizeStartRef.current.startW + deltaX);
      const newH = Math.max(20, resizeStartRef.current.startH + deltaY);
      resizeComponent(node.id, newW, newH);
    };

    const handleMouseUp = () => {
      resizeStartRef.current = null;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectComponent(node.id);
  };

  // Render component visual representation
  const renderControl = () => {
    switch (node.type) {
      case 'JPanel':
        return (
          <div
            className={`w-full h-full rounded-md relative transition-colors ${
              isDarkPreview
                ? isOver
                  ? 'border-2 border-indigo-500 bg-indigo-500/10'
                  : 'border border-white/[0.14] bg-white/[0.04]'
                : isOver
                ? 'border-2 border-indigo-500 bg-indigo-500/10'
                : 'border border-[#b0b0b0]'
            }`}
            style={{
              backgroundColor: node.props.background && node.props.background !== '#ffffff'
                ? String(node.props.background)
                : undefined,
            }}
          >
            {/* Render nested children */}
            {node.children.map((child) => (
              <CanvasNodeView key={child.id} node={child} isDarkPreview={isDarkPreview} />
            ))}
          </div>
        );

      case 'JButton':
        return isDarkPreview ? (
          <button
            type="button"
            disabled={node.props.enabled === false}
            className={`w-full h-full flex items-center justify-center text-xs px-2.5 rounded-md border font-medium select-none transition shadow-sm ${
              node.props.enabled === false
                ? 'bg-zinc-800 text-zinc-500 border-white/[0.05] cursor-not-allowed'
                : 'bg-gradient-to-b from-[#2d2d42] to-[#202032] hover:from-[#35354e] hover:to-[#26263c] text-white border-white/[0.15] active:scale-[0.98] cursor-pointer'
            }`}
          >
            <span className="truncate">{String(node.props.text ?? 'Button')}</span>
          </button>
        ) : (
          <button
            type="button"
            disabled={node.props.enabled === false}
            className={`w-full h-full flex items-center justify-center font-sans text-xs px-2 shadow-sm rounded-sm border select-none transition ${
              node.props.enabled === false
                ? 'bg-[#e0e0e0] text-[#888888] border-[#c0c0c0] cursor-not-allowed'
                : 'bg-gradient-to-b from-[#fdfdfd] to-[#e4e4e4] hover:from-[#f0f0f0] hover:to-[#dadada] text-[#111111] border-[#ababab] active:shadow-inner cursor-pointer'
            }`}
          >
            <span className="truncate">{String(node.props.text ?? 'Button')}</span>
          </button>
        );

      case 'JLabel':
        return (
          <div className={`w-full h-full flex items-center text-xs px-1 truncate select-none font-medium ${
            isDarkPreview ? 'text-zinc-200' : 'text-[#111111]'
          }`}>
            {String(node.props.text ?? 'Label')}
          </div>
        );

      case 'JTextField':
        return isDarkPreview ? (
          <div className="w-full h-full flex items-center text-xs bg-[#101018] text-zinc-100 px-2.5 border border-white/[0.14] rounded-md shadow-inner select-none truncate">
            {String(node.props.text ?? '') || (
              <span className="text-zinc-600 italic">JTextField</span>
            )}
          </div>
        ) : (
          <div className="w-full h-full flex items-center font-sans text-xs bg-white text-[#111111] px-2 border border-[#7f9db9] shadow-inner select-none truncate">
            {String(node.props.text ?? '') || (
              <span className="text-gray-400 italic">JTextField</span>
            )}
          </div>
        );

      case 'JTextArea':
        return isDarkPreview ? (
          <div className="w-full h-full text-xs bg-[#101018] text-zinc-100 p-2 border border-white/[0.14] rounded-md shadow-inner select-none overflow-hidden whitespace-pre-wrap">
            {String(node.props.text ?? '') || (
              <span className="text-zinc-600 italic">JTextArea</span>
            )}
          </div>
        ) : (
          <div className="w-full h-full font-sans text-xs bg-white text-[#111111] p-1.5 border border-[#7f9db9] shadow-inner select-none overflow-hidden whitespace-pre-wrap">
            {String(node.props.text ?? '') || (
              <span className="text-gray-400 italic">JTextArea</span>
            )}
          </div>
        );

      case 'JCheckBox':
        return (
          <div className={`w-full h-full flex items-center gap-2 text-xs px-1 select-none ${
            isDarkPreview ? 'text-zinc-200' : 'text-[#111111]'
          }`}>
            <input
              type="checkbox"
              checked={Boolean(node.props.selected)}
              readOnly
              className="w-3.5 h-3.5 accent-indigo-500 pointer-events-none rounded cursor-pointer"
            />
            <span className="truncate font-medium">{String(node.props.text ?? 'CheckBox')}</span>
          </div>
        );

      default:
        return (
          <div className="w-full h-full border border-dashed border-zinc-500 p-1 text-[11px] text-zinc-400">
            {node.type}
          </div>
        );
    }
  };

  return (
    <div
      ref={combineRefs}
      onClick={handleClick}
      style={{
        position: 'absolute',
        left: `${currentX}px`,
        top: `${currentY}px`,
        width: `${layout.width}px`,
        height: `${layout.height}px`,
        zIndex: isDragging ? 999 : isSelected ? 50 : 10,
        opacity: isDragging ? 0.7 : 1,
      }}
      className={`group transition-shadow ${
        isSelected
          ? 'ring-2 ring-indigo-500 shadow-glow-sm'
          : 'hover:ring-1 hover:ring-indigo-400/50'
      }`}
    >
      {/* Sleek floating variable badge on select */}
      {isSelected && (
        <div
          {...listeners}
          {...attributes}
          className="absolute -top-6 left-0 px-2 py-0.5 rounded-md bg-indigo-600 text-white text-[10px] font-mono font-semibold tracking-tight cursor-move flex items-center gap-1 shadow-lg shadow-indigo-600/30 border border-indigo-400/40 select-none z-50"
        >
          <span>{node.varName}</span>
        </div>
      )}

      {/* Component Content */}
      <div className="w-full h-full relative" {...(!isContainer ? { ...listeners, ...attributes } : {})}>
        {renderControl()}
      </div>

      {/* Resize Handle (bottom-right corner) when selected */}
      {isSelected && (
        <div
          onMouseDown={handleResizeMouseDown}
          className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-indigo-500 border-2 border-white rounded-sm cursor-se-resize z-50 shadow-md shadow-indigo-500/50"
          title="Drag to resize"
        />
      )}
    </div>
  );
};

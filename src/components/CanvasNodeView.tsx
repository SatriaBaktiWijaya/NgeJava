import React, { useRef } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CanvasNode } from '../types/builder';
import { useBuilderStore } from '../store/useBuilderStore';

interface CanvasNodeViewProps {
  node: CanvasNode;
}

export const CanvasNodeView: React.FC<CanvasNodeViewProps> = ({ node }) => {
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

  // Render Swing component look & feel
  const renderControl = () => {
    switch (node.type) {
      case 'JPanel':
        return (
          <div
            className={`w-full h-full border rounded-sm relative transition-colors ${
              isOver ? 'border-[#007acc] bg-[#007acc]/10' : 'border-[#b0b0b0]'
            }`}
            style={{
              backgroundColor: String(node.props.background || '#ffffff'),
            }}
          >
            {/* Render nested children */}
            {node.children.map((child) => (
              <CanvasNodeView key={child.id} node={child} />
            ))}
          </div>
        );

      case 'JButton':
        return (
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
          <div className="w-full h-full flex items-center font-sans text-xs text-[#111111] px-1 truncate select-none">
            {String(node.props.text ?? 'Label')}
          </div>
        );

      case 'JTextField':
        return (
          <div className="w-full h-full flex items-center font-sans text-xs bg-white text-[#111111] px-2 border border-[#7f9db9] shadow-inner select-none truncate">
            {String(node.props.text ?? '') || (
              <span className="text-gray-400 italic">JTextField</span>
            )}
          </div>
        );

      case 'JTextArea':
        return (
          <div className="w-full h-full font-sans text-xs bg-white text-[#111111] p-1.5 border border-[#7f9db9] shadow-inner select-none overflow-hidden whitespace-pre-wrap">
            {String(node.props.text ?? '') || (
              <span className="text-gray-400 italic">JTextArea</span>
            )}
          </div>
        );

      case 'JCheckBox':
        return (
          <div className="w-full h-full flex items-center gap-1.5 font-sans text-xs text-[#111111] px-1 select-none">
            <input
              type="checkbox"
              checked={Boolean(node.props.selected)}
              readOnly
              className="w-3.5 h-3.5 accent-[#007acc] pointer-events-none"
            />
            <span className="truncate">{String(node.props.text ?? 'CheckBox')}</span>
          </div>
        );

      default:
        return (
          <div className="w-full h-full border border-dashed border-gray-400 p-1 text-[11px] text-gray-700">
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
      className={`group ${
        isSelected
          ? 'ring-2 ring-[#007acc] ring-offset-1 ring-offset-transparent'
          : 'hover:ring-1 hover:ring-sky-400/60'
      }`}
    >
      {/* Draggable handle bar / badge on hover/select */}
      {isSelected && (
        <div
          {...listeners}
          {...attributes}
          className="absolute -top-5 left-0 px-1.5 py-0.2 rounded bg-[#007acc] text-white text-[9px] font-mono tracking-tight cursor-move flex items-center gap-1 shadow select-none"
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
          className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-[#007acc] border border-white rounded-none cursor-se-resize z-50 shadow-sm"
          title="Drag to resize"
        />
      )}
    </div>
  );
};

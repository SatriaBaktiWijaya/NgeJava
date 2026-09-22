import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { 
  Square, 
  Layers, 
  MousePointerClick, 
  Type, 
  FormInput, 
  AlignLeft, 
  CheckSquare,
  Component,
  GripVertical,
  Plus
} from 'lucide-react';
import { COMPONENT_REGISTRY } from '../registry/componentRegistry';
import { useBuilderStore } from '../store/useBuilderStore';

interface PaletteItemProps {
  type: string;
  label: string;
  icon: React.ReactNode;
  disabled?: boolean;
  onAddDirectly?: (type: string) => void;
}

const DraggablePaletteItem: React.FC<PaletteItemProps> = ({ 
  type, 
  label, 
  icon, 
  disabled,
  onAddDirectly 
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `palette:${type}`,
    disabled,
    data: { type },
  });

  const style: React.CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 9999 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onDoubleClick={() => !disabled && onAddDirectly && onAddDirectly(type)}
      className={`group flex items-center justify-between px-2.5 py-2 rounded-md border text-xs transition shadow-sm select-none ${
        disabled
          ? 'bg-[#1e1e1e] border-[#333333] text-[#666666] cursor-not-allowed'
          : isDragging
          ? 'bg-[#007acc]/20 border-[#007acc] text-white cursor-grabbing shadow-lg'
          : 'bg-[#2d2d2d] hover:bg-[#383838] border-[#3c3c3c] text-[#dddddd] cursor-grab active:cursor-grabbing hover:border-[#555555]'
      }`}
    >
      <div className="flex items-center gap-2">
        {icon}
        <span className="font-medium">{label}</span>
      </div>

      {!disabled && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onAddDirectly) onAddDirectly(type);
            }}
            title={`Add ${label} to selected container`}
            className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-[#4a4a4a] text-sky-400 transition"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <GripVertical className="w-3.5 h-3.5 text-[#666666] opacity-60" />
        </div>
      )}
    </div>
  );
};

export const Palette: React.FC = () => {
  const addComponent = useBuilderStore((s) => s.addComponent);
  const selectedComponentId = useBuilderStore((s) => s.selectedComponentId);
  const rootId = useBuilderStore((s) => s.rootId);
  const tree = useBuilderStore((s) => s.tree);

  // Helper to determine target container: if selected is a container (JPanel), use it; otherwise use root JFrame
  const handleAddDirectly = (type: string) => {
    let targetContainer = rootId || '';
    if (selectedComponentId && tree) {
      const selectedNode = findNode(tree, selectedComponentId);
      if (selectedNode && COMPONENT_REGISTRY[selectedNode.type]?.isContainer) {
        targetContainer = selectedComponentId;
      }
    }
    if (targetContainer) {
      addComponent(targetContainer, type, { x: 30 + Math.floor(Math.random() * 40), y: 30 + Math.floor(Math.random() * 40) });
    }
  };

  function findNode(root: any, id: string): any {
    if (!root) return null;
    if (root.id === id) return root;
    for (const child of root.children) {
      const found = findNode(child, id);
      if (found) return found;
    }
    return null;
  }

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Square': return <Square className="w-4 h-4 text-sky-400" />;
      case 'Layers': return <Layers className="w-4 h-4 text-indigo-400" />;
      case 'MousePointerClick': return <MousePointerClick className="w-4 h-4 text-emerald-400" />;
      case 'Type': return <Type className="w-4 h-4 text-amber-400" />;
      case 'FormInput': return <FormInput className="w-4 h-4 text-cyan-400" />;
      case 'AlignLeft': return <AlignLeft className="w-4 h-4 text-violet-400" />;
      case 'CheckSquare': return <CheckSquare className="w-4 h-4 text-pink-400" />;
      default: return <Component className="w-4 h-4 text-gray-400" />;
    }
  };

  const entries = Object.values(COMPONENT_REGISTRY);
  const containers = entries.filter((e) => e.isContainer);
  const controls = entries.filter((e) => !e.isContainer);

  return (
    <div className="w-[230px] h-full bg-[#252526] border-r border-[#333333] flex flex-col select-none shrink-0 z-10">
      <div className="h-9 px-3 border-b border-[#333333] flex items-center gap-2 text-xs font-semibold text-[#bbbbbb] tracking-wide uppercase bg-[#202020]">
        <Component className="w-3.5 h-3.5 text-[#007acc]" />
        <span>Palette</span>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        {/* Containers */}
        <div>
          <div className="px-2 py-1 text-[10px] font-bold text-[#888888] uppercase tracking-wider">
            Containers
          </div>
          <div className="space-y-1 mt-1">
            {containers.map((item) => (
              <DraggablePaletteItem
                key={item.type}
                type={item.type}
                label={item.label}
                icon={getIcon(item.icon)}
                disabled={item.type === 'JFrame'}
                onAddDirectly={handleAddDirectly}
              />
            ))}
          </div>
        </div>

        {/* Controls */}
        <div>
          <div className="px-2 py-1 text-[10px] font-bold text-[#888888] uppercase tracking-wider">
            Controls (Swing)
          </div>
          <div className="space-y-1 mt-1">
            {controls.map((item) => (
              <DraggablePaletteItem
                key={item.type}
                type={item.type}
                label={item.label}
                icon={getIcon(item.icon)}
                onAddDirectly={handleAddDirectly}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="p-2 border-t border-[#333333] text-[10px] text-[#777777] text-center bg-[#202020]">
        Drag or click <span className="text-sky-400 font-bold">+</span> to add
      </div>
    </div>
  );
};

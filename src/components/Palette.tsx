import React, { useState } from 'react';
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
  Plus,
  Search,
  GripVertical
} from 'lucide-react';
import { COMPONENT_REGISTRY } from '../registry/componentRegistry';
import { useBuilderStore } from '../store/useBuilderStore';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';

interface PaletteItemProps {
  type: string;
  label: string;
  icon: React.ReactNode;
  iconBg: string;
  disabled?: boolean;
  onAddDirectly?: (type: string) => void;
}

const DraggablePaletteItem: React.FC<PaletteItemProps> = ({ 
  type, 
  label, 
  icon, 
  iconBg,
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
    opacity: isDragging ? 0.35 : 1,
    zIndex: isDragging ? 9999 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onDoubleClick={() => !disabled && onAddDirectly && onAddDirectly(type)}
      className={`group flex items-center justify-between px-2.5 py-2 rounded-lg border transition-all duration-150 select-none ${
        disabled
          ? 'bg-white/[0.01] border-white/[0.04] text-zinc-600 cursor-not-allowed'
          : isDragging
          ? 'bg-indigo-500/20 border-indigo-500 text-white shadow-lg shadow-indigo-500/25 cursor-grabbing'
          : 'bg-white/[0.025] hover:bg-white/[0.06] border-white/[0.06] hover:border-indigo-500/35 text-zinc-200 cursor-grab active:cursor-grabbing hover:scale-[1.01]'
      }`}
    >
      <div className="flex items-center gap-2.5">
        <div className={`p-1.5 rounded-md ${iconBg} shadow-xs`}>
          {icon}
        </div>
        <div className="flex flex-col">
          <span className="font-medium text-xs text-zinc-100">{label}</span>
          <span className="text-[10px] text-zinc-500 font-mono leading-none">{type}</span>
        </div>
      </div>

      {!disabled && (
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onAddDirectly) onAddDirectly(type);
                }}
                className="opacity-0 group-hover:opacity-100 h-6 w-6 rounded-md bg-indigo-500/20 hover:bg-indigo-500 text-indigo-300 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Add to canvas</TooltipContent>
          </Tooltip>
          <GripVertical className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
        </div>
      )}
    </div>
  );
};

export const Palette: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const addComponent = useBuilderStore((s) => s.addComponent);
  const selectedComponentId = useBuilderStore((s) => s.selectedComponentId);
  const rootId = useBuilderStore((s) => s.rootId);
  const tree = useBuilderStore((s) => s.tree);

  const handleAddDirectly = (type: string) => {
    let targetContainer = rootId || '';
    if (selectedComponentId && tree) {
      const selectedNode = findNode(tree, selectedComponentId);
      if (selectedNode && COMPONENT_REGISTRY[selectedNode.type]?.isContainer) {
        targetContainer = selectedComponentId;
      }
    }
    if (targetContainer) {
      addComponent(targetContainer, type, { 
        x: 30 + Math.floor(Math.random() * 40), 
        y: 30 + Math.floor(Math.random() * 40) 
      });
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

  const getItemVisuals = (type: string) => {
    const iconClass = "w-3.5 h-3.5";
    switch (type) {
      case 'JFrame':
        return { icon: <Square className={iconClass} />, bg: 'bg-sky-500/15 text-sky-400 border border-sky-500/25' };
      case 'JPanel':
        return { icon: <Layers className={iconClass} />, bg: 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/25' };
      case 'JButton':
        return { icon: <MousePointerClick className={iconClass} />, bg: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' };
      case 'JLabel':
        return { icon: <Type className={iconClass} />, bg: 'bg-amber-500/15 text-amber-400 border border-amber-500/25' };
      case 'JTextField':
        return { icon: <FormInput className={iconClass} />, bg: 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/25' };
      case 'JTextArea':
        return { icon: <AlignLeft className={iconClass} />, bg: 'bg-violet-500/15 text-violet-400 border border-violet-500/25' };
      case 'JCheckBox':
        return { icon: <CheckSquare className={iconClass} />, bg: 'bg-pink-500/15 text-pink-400 border border-pink-500/25' };
      default:
        return { icon: <Component className={iconClass} />, bg: 'bg-zinc-500/15 text-zinc-400 border border-zinc-500/25' };
    }
  };

  const entries = Object.values(COMPONENT_REGISTRY).filter((e) =>
    e.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.type.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const containers = entries.filter((e) => e.isContainer);
  const controls = entries.filter((e) => !e.isContainer);

  return (
    <div className="w-[215px] h-full bg-[#0d0d14] border-r border-white/[0.08] flex flex-col select-none shrink-0 z-10">
      {/* Header */}
      <div className="h-11 px-3.5 border-b border-white/[0.08] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500/50" />
          <span className="text-xs font-semibold text-white tracking-tight">
            Component Library
          </span>
        </div>
        <Badge variant="outline" className="text-[10px] font-mono text-zinc-400 border-white/[0.08] bg-white/[0.02]">
          {entries.length} items
        </Badge>
      </div>

      {/* Modern Search */}
      <div className="p-2.5 border-b border-white/[0.06]">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter components..."
            className="pl-8 h-8 text-xs bg-white/[0.03] border-white/[0.08] focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 rounded-lg placeholder:text-zinc-600"
          />
        </div>
      </div>

      {/* Categorized Component Tiles */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-4">
        {containers.length > 0 && (
          <div>
            <div className="px-1.5 py-1 text-[10px] font-mono text-zinc-400 uppercase tracking-wider flex items-center justify-between">
              <span>Containers</span>
              <span className="text-[9px] text-zinc-600">{containers.length}</span>
            </div>
            <div className="space-y-1.5 mt-1">
              {containers.map((item) => {
                const visuals = getItemVisuals(item.type);
                return (
                  <DraggablePaletteItem
                    key={item.type}
                    type={item.type}
                    label={item.label}
                    icon={visuals.icon}
                    iconBg={visuals.bg}
                    disabled={item.type === 'JFrame'}
                    onAddDirectly={handleAddDirectly}
                  />
                );
              })}
            </div>
          </div>
        )}

        {controls.length > 0 && (
          <div>
            <div className="px-1.5 py-1 text-[10px] font-mono text-zinc-400 uppercase tracking-wider flex items-center justify-between">
              <span>Swing Controls</span>
              <span className="text-[9px] text-zinc-600">{controls.length}</span>
            </div>
            <div className="space-y-1.5 mt-1">
              {controls.map((item) => {
                const visuals = getItemVisuals(item.type);
                return (
                  <DraggablePaletteItem
                    key={item.type}
                    type={item.type}
                    label={item.label}
                    icon={visuals.icon}
                    iconBg={visuals.bg}
                    onAddDirectly={handleAddDirectly}
                  />
                );
              })}
            </div>
          </div>
        )}

        {entries.length === 0 && (
          <div className="p-6 text-center text-xs text-zinc-500">
            No components match "{searchQuery}"
          </div>
        )}
      </div>

      <div className="p-2.5 border-t border-white/[0.08] text-[11px] text-zinc-500 text-center bg-white/[0.01]">
        Drag to canvas or click <span className="text-indigo-400 font-semibold">+</span>
      </div>
    </div>
  );
};

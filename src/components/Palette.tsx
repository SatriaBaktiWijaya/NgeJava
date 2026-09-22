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
  GripVertical,
  Plus,
  Search
} from 'lucide-react';
import { COMPONENT_REGISTRY } from '../registry/componentRegistry';
import { useBuilderStore } from '../store/useBuilderStore';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';

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
      className={`group flex items-center justify-between px-2.5 py-1.5 rounded-md border text-xs transition-all shadow-xs select-none ${
        disabled
          ? 'bg-muted/30 border-border/40 text-muted-foreground/50 cursor-not-allowed'
          : isDragging
          ? 'bg-primary/20 border-primary text-primary-foreground cursor-grabbing shadow-md'
          : 'bg-card hover:bg-accent/70 border-border/70 text-foreground/90 cursor-grab active:cursor-grabbing hover:border-border'
      }`}
    >
      <div className="flex items-center gap-2.5">
        <div className="p-1 rounded bg-muted/60 text-foreground/80 group-hover:text-primary transition-colors">
          {icon}
        </div>
        <span className="font-medium text-xs">{label}</span>
      </div>

      {!disabled && (
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onAddDirectly) onAddDirectly(type);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-primary/20 text-primary transition-opacity cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Add to canvas</TooltipContent>
          </Tooltip>
          <GripVertical className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-muted-foreground/80 transition-colors" />
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
        x: 30 + Math.floor(Math.random() * 50), 
        y: 30 + Math.floor(Math.random() * 50) 
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

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Square': return <Square className="w-3.5 h-3.5 text-sky-400" />;
      case 'Layers': return <Layers className="w-3.5 h-3.5 text-indigo-400" />;
      case 'MousePointerClick': return <MousePointerClick className="w-3.5 h-3.5 text-emerald-400" />;
      case 'Type': return <Type className="w-3.5 h-3.5 text-amber-400" />;
      case 'FormInput': return <FormInput className="w-3.5 h-3.5 text-cyan-400" />;
      case 'AlignLeft': return <AlignLeft className="w-3.5 h-3.5 text-violet-400" />;
      case 'CheckSquare': return <CheckSquare className="w-3.5 h-3.5 text-pink-400" />;
      default: return <Component className="w-3.5 h-3.5 text-muted-foreground" />;
    }
  };

  const entries = Object.values(COMPONENT_REGISTRY).filter((e) =>
    e.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.type.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const containers = entries.filter((e) => e.isContainer);
  const controls = entries.filter((e) => !e.isContainer);

  return (
    <div className="w-[240px] h-full bg-background border-r border-border flex flex-col select-none shrink-0 z-10">
      {/* Header */}
      <div className="h-10 px-3.5 border-b border-border flex items-center justify-between bg-muted/20">
        <div className="flex items-center gap-2 text-xs font-semibold text-foreground/90 tracking-wide uppercase">
          <Component className="w-3.5 h-3.5 text-primary" />
          <span>Palette</span>
        </div>
        <Badge variant="secondary" className="text-[10px] px-1.5 h-4 font-mono font-normal">
          {entries.length} items
        </Badge>
      </div>

      {/* Quick Search */}
      <div className="p-2 border-b border-border/50">
        <div className="relative">
          <Search className="w-3 h-3 text-muted-foreground absolute left-2.5 top-2" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search components..."
            className="pl-7 h-7 text-xs bg-muted/40 border-border/60 placeholder:text-muted-foreground/60"
          />
        </div>
      </div>

      {/* Items List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-4">
        {/* Containers */}
        {containers.length > 0 && (
          <div>
            <div className="px-1.5 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              <span>Containers</span>
              <span className="text-[9px] font-mono">{containers.length}</span>
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
        )}

        {/* Controls */}
        {controls.length > 0 && (
          <div>
            <div className="px-1.5 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              <span>Swing Controls</span>
              <span className="text-[9px] font-mono">{controls.length}</span>
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
        )}

        {entries.length === 0 && (
          <div className="p-4 text-center text-xs text-muted-foreground">
            No components match "{searchQuery}"
          </div>
        )}
      </div>

      <div className="p-2 border-t border-border text-[10px] text-muted-foreground text-center bg-muted/10">
        Drag or click <span className="text-primary font-bold">+</span> to add to form
      </div>
    </div>
  );
};

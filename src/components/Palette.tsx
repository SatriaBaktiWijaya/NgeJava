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
  Search
} from 'lucide-react';
import { COMPONENT_REGISTRY } from '../registry/componentRegistry';
import { useBuilderStore } from '../store/useBuilderStore';
import { Input } from './ui/input';

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
      className={`group flex items-center justify-between px-2.5 py-1.5 rounded-[4px] border text-xs transition-all select-none ${
        disabled
          ? 'bg-muted/20 border-border/40 text-muted-foreground/40 cursor-not-allowed'
          : isDragging
          ? 'bg-card border-foreground/40 text-foreground cursor-grabbing'
          : 'bg-card hover:bg-secondary/70 border-border text-foreground/90 cursor-grab active:cursor-grabbing hover:border-foreground/20'
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground group-hover:text-foreground transition-colors">
          {icon}
        </span>
        <span className="font-normal text-xs">{label}</span>
      </div>

      {!disabled && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onAddDirectly) onAddDirectly(type);
          }}
          title="Add to canvas"
          className="opacity-0 group-hover:opacity-100 p-0.5 rounded-[3px] hover:bg-foreground/10 text-muted-foreground hover:text-foreground transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
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

  const getIcon = (iconName: string) => {
    const iconClass = "w-3.5 h-3.5";
    switch (iconName) {
      case 'Square': return <Square className={iconClass} />;
      case 'Layers': return <Layers className={iconClass} />;
      case 'MousePointerClick': return <MousePointerClick className={iconClass} />;
      case 'Type': return <Type className={iconClass} />;
      case 'FormInput': return <FormInput className={iconClass} />;
      case 'AlignLeft': return <AlignLeft className={iconClass} />;
      case 'CheckSquare': return <CheckSquare className={iconClass} />;
      default: return <Component className={iconClass} />;
    }
  };

  const entries = Object.values(COMPONENT_REGISTRY).filter((e) =>
    e.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.type.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const containers = entries.filter((e) => e.isContainer);
  const controls = entries.filter((e) => !e.isContainer);

  return (
    <div className="w-[220px] h-full bg-background border-r border-border flex flex-col select-none shrink-0 z-10">
      {/* Header */}
      <div className="h-10 px-3 border-b border-border flex items-center justify-between">
        <span className="text-xs font-medium text-foreground tracking-tight">
          Components
        </span>
        <span className="text-[10px] font-mono text-muted-foreground px-1.5 py-0.5 rounded-[3px] bg-secondary">
          {entries.length}
        </span>
      </div>

      {/* Minimalist Search */}
      <div className="p-2 border-b border-border/60">
        <div className="relative">
          <Search className="w-3 h-3 text-muted-foreground/70 absolute left-2.5 top-2" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="pl-7 h-7 text-xs bg-card border-border rounded-[4px] focus-visible:ring-1 focus-visible:ring-border placeholder:text-muted-foreground/50"
          />
        </div>
      </div>

      {/* Categorized List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        {containers.length > 0 && (
          <div>
            <div className="px-1 py-1 text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
              Containers
            </div>
            <div className="space-y-1 mt-0.5">
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

        {controls.length > 0 && (
          <div>
            <div className="px-1 py-1 text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
              Controls
            </div>
            <div className="space-y-1 mt-0.5">
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
      </div>

      <div className="p-2 border-t border-border text-[10px] font-mono text-muted-foreground/80 text-center">
        Drag to canvas or click +
      </div>
    </div>
  );
};

import React from 'react';
import { SlidersHorizontal, Info, Move, Maximize2 } from 'lucide-react';
import { useBuilderStore } from '../store/useBuilderStore';
import { COMPONENT_REGISTRY } from '../registry/componentRegistry';
import { CanvasNode, PropertyValue } from '../types/builder';

function findNodeById(root: CanvasNode | null, id: string): CanvasNode | null {
  if (!root) return null;
  if (root.id === id) return root;
  for (const child of root.children) {
    const found = findNodeById(child, id);
    if (found) return found;
  }
  return null;
}

export const PropertyInspector: React.FC = () => {
  const tree = useBuilderStore((s) => s.tree);
  const selectedComponentId = useBuilderStore((s) => s.selectedComponentId);
  const updateComponentProp = useBuilderStore((s) => s.updateComponentProp);
  const moveComponent = useBuilderStore((s) => s.moveComponent);
  const resizeComponent = useBuilderStore((s) => s.resizeComponent);

  const selectedNode = selectedComponentId ? findNodeById(tree, selectedComponentId) : null;
  const registryEntry = selectedNode ? COMPONENT_REGISTRY[selectedNode.type] : null;

  const handlePropChange = (key: string, value: PropertyValue) => {
    if (!selectedNode) return;
    updateComponentProp(selectedNode.id, key, value);
  };

  return (
    <div className="w-[280px] h-full bg-[#252526] border-l border-[#333333] flex flex-col select-none shrink-0 z-10">
      {/* Header */}
      <div className="h-9 px-3 border-b border-[#333333] flex items-center gap-2 text-xs font-semibold text-[#bbbbbb] tracking-wide uppercase bg-[#202020]">
        <SlidersHorizontal className="w-3.5 h-3.5 text-[#007acc]" />
        <span>Properties</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {!selectedNode || !registryEntry ? (
          <div className="p-4 text-center text-xs text-[#888888] space-y-2 mt-4">
            <Info className="w-6 h-6 mx-auto text-[#666666]" />
            <p className="font-medium text-[#aaaaaa]">No Component Selected</p>
            <p className="text-[11px] text-[#777777]">
              Click any element or window on the canvas to inspect and edit its properties.
            </p>
          </div>
        ) : (
          <>
            {/* Component Identity Card */}
            <div className="p-2.5 rounded bg-[#1e1e1e] border border-[#383838]">
              <div className="text-[10px] text-[#858585] uppercase tracking-wider font-semibold">
                Component
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-sm font-semibold text-[#e1e1e1] font-mono">
                  {selectedNode.varName}
                </span>
                <span className="px-2 py-0.5 rounded bg-[#333333] text-[10px] text-sky-400 font-mono">
                  {selectedNode.type}
                </span>
              </div>
            </div>

            {/* Layout Geometry Inspector (if non-root node) */}
            {selectedNode.layout && (
              <div className="space-y-2 pt-1 border-t border-[#333333]">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#888888] uppercase tracking-wider">
                  <Move className="w-3 h-3 text-[#007acc]" />
                  <span>Position & Size</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="space-y-1">
                    <label className="text-[11px] text-[#aaaaaa]">X (px)</label>
                    <input
                      type="number"
                      value={selectedNode.layout.x}
                      onChange={(e) =>
                        moveComponent(
                          selectedNode.id,
                          Number(e.target.value),
                          selectedNode.layout!.y
                        )
                      }
                      className="w-full h-7 px-2 text-xs bg-[#1e1e1e] border border-[#3c3c3c] rounded text-[#cccccc] focus:border-[#007acc] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-[#aaaaaa]">Y (px)</label>
                    <input
                      type="number"
                      value={selectedNode.layout.y}
                      onChange={(e) =>
                        moveComponent(
                          selectedNode.id,
                          selectedNode.layout!.x,
                          Number(e.target.value)
                        )
                      }
                      className="w-full h-7 px-2 text-xs bg-[#1e1e1e] border border-[#3c3c3c] rounded text-[#cccccc] focus:border-[#007acc] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-[#aaaaaa]">Width (px)</label>
                    <input
                      type="number"
                      value={selectedNode.layout.width}
                      onChange={(e) =>
                        resizeComponent(
                          selectedNode.id,
                          Number(e.target.value),
                          selectedNode.layout!.height
                        )
                      }
                      className="w-full h-7 px-2 text-xs bg-[#1e1e1e] border border-[#3c3c3c] rounded text-[#cccccc] focus:border-[#007acc] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-[#aaaaaa]">Height (px)</label>
                    <input
                      type="number"
                      value={selectedNode.layout.height}
                      onChange={(e) =>
                        resizeComponent(
                          selectedNode.id,
                          selectedNode.layout!.width,
                          Number(e.target.value)
                        )
                      }
                      className="w-full h-7 px-2 text-xs bg-[#1e1e1e] border border-[#3c3c3c] rounded text-[#cccccc] focus:border-[#007acc] focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Dynamic Schema Properties */}
            <div className="space-y-3 pt-1 border-t border-[#333333]">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#888888] uppercase tracking-wider">
                <Maximize2 className="w-3 h-3 text-emerald-400" />
                <span>Properties ({selectedNode.type})</span>
              </div>

              {registryEntry.propertySchema.map((entry) => {
                const val = selectedNode.props[entry.key];

                switch (entry.type) {
                  case 'string':
                    return (
                      <div key={entry.key} className="space-y-1">
                        <label className="text-xs text-[#aaaaaa] flex justify-between">
                          <span>{entry.label}</span>
                          <span className="text-[10px] text-[#666666] font-mono">{entry.key}</span>
                        </label>
                        <input
                          type="text"
                          value={String(val ?? '')}
                          onChange={(e) => handlePropChange(entry.key, e.target.value)}
                          className="w-full h-7 px-2 text-xs bg-[#1e1e1e] border border-[#3c3c3c] rounded text-[#cccccc] focus:border-[#007acc] focus:outline-none"
                        />
                      </div>
                    );

                  case 'number':
                    return (
                      <div key={entry.key} className="space-y-1">
                        <label className="text-xs text-[#aaaaaa] flex justify-between">
                          <span>{entry.label}</span>
                          <span className="text-[10px] text-[#666666] font-mono">{entry.key}</span>
                        </label>
                        <input
                          type="number"
                          value={Number(val ?? 0)}
                          onChange={(e) => handlePropChange(entry.key, Number(e.target.value))}
                          className="w-full h-7 px-2 text-xs bg-[#1e1e1e] border border-[#3c3c3c] rounded text-[#cccccc] focus:border-[#007acc] focus:outline-none"
                        />
                      </div>
                    );

                  case 'boolean':
                    return (
                      <div
                        key={entry.key}
                        className="flex items-center justify-between p-2 rounded bg-[#1e1e1e] border border-[#383838]"
                      >
                        <span className="text-xs text-[#aaaaaa]">{entry.label}</span>
                        <input
                          type="checkbox"
                          checked={Boolean(val)}
                          onChange={(e) => handlePropChange(entry.key, e.target.checked)}
                          className="w-4 h-4 accent-[#007acc] cursor-pointer"
                        />
                      </div>
                    );

                  case 'color':
                    return (
                      <div key={entry.key} className="space-y-1">
                        <label className="text-xs text-[#aaaaaa] flex justify-between">
                          <span>{entry.label}</span>
                          <span className="text-[10px] text-[#666666] font-mono">{entry.key}</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={String(val ?? '#ffffff')}
                            onChange={(e) => handlePropChange(entry.key, e.target.value)}
                            className="w-7 h-7 p-0 border border-[#3c3c3c] rounded bg-transparent cursor-pointer"
                          />
                          <input
                            type="text"
                            value={String(val ?? '#ffffff')}
                            onChange={(e) => handlePropChange(entry.key, e.target.value)}
                            className="flex-1 h-7 px-2 text-xs font-mono bg-[#1e1e1e] border border-[#3c3c3c] rounded text-[#cccccc] focus:border-[#007acc] focus:outline-none uppercase"
                          />
                        </div>
                      </div>
                    );

                  default:
                    return null;
                }
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

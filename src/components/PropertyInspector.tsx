import React from 'react';
import { Info, Move, Settings2, Sliders, Trash2, Box } from 'lucide-react';
import { useBuilderStore } from '../store/useBuilderStore';
import { COMPONENT_REGISTRY } from '../registry/componentRegistry';
import { CanvasNode, PropertyValue } from '../types/builder';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Separator } from './ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

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
  const rootId = useBuilderStore((s) => s.rootId);
  const selectedComponentId = useBuilderStore((s) => s.selectedComponentId);
  const updateComponentProp = useBuilderStore((s) => s.updateComponentProp);
  const moveComponent = useBuilderStore((s) => s.moveComponent);
  const resizeComponent = useBuilderStore((s) => s.resizeComponent);
  const removeComponent = useBuilderStore((s) => s.removeComponent);

  const selectedNode = selectedComponentId ? findNodeById(tree, selectedComponentId) : null;
  const registryEntry = selectedNode ? COMPONENT_REGISTRY[selectedNode.type] : null;

  const handlePropChange = (key: string, value: PropertyValue) => {
    if (!selectedNode) return;
    updateComponentProp(selectedNode.id, key, value);
  };

  return (
    <div className="w-[260px] h-full bg-[#0d0d14] border-l border-white/[0.08] flex flex-col select-none shrink-0 z-10">
      {/* Header */}
      <div className="h-11 px-3.5 border-b border-white/[0.08] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-semibold text-white tracking-tight">
            Inspector
          </span>
        </div>
        {selectedNode && (
          <Badge className="text-[10px] font-mono px-2 py-0.5 bg-indigo-500/15 text-indigo-300 border-indigo-500/30 rounded-md">
            {selectedNode.type}
          </Badge>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {!selectedNode || !registryEntry ? (
          <div className="p-5 text-center text-xs text-zinc-500 space-y-2 mt-8 border border-dashed border-white/[0.08] rounded-xl bg-white/[0.01]">
            <Info className="w-6 h-6 mx-auto text-zinc-600" />
            <p className="font-semibold text-zinc-300">No Element Selected</p>
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Click any component on the canvas to inspect and edit its properties.
            </p>
          </div>
        ) : (
          <>
            {/* Identity Card */}
            <div className="p-2.5 rounded-xl bg-gradient-to-r from-indigo-950/30 via-[#13131e] to-[#13131e] border border-indigo-500/20 shadow-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase text-zinc-400 tracking-wider">
                  Java Variable
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">
                  #{selectedNode.id.slice(0, 6)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold font-mono text-white tracking-tight truncate max-w-[160px]">
                  {selectedNode.varName}
                </span>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/[0.06] text-zinc-300">
                  {selectedNode.type}
                </span>
              </div>
            </div>

            {/* Segmented Control Tabs */}
            <Tabs defaultValue="properties" className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-7.5 bg-white/[0.03] border border-white/[0.06] p-0.5 rounded-lg">
                <TabsTrigger value="properties" className="text-xs h-6.5 rounded-md data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-xs transition-all">
                  <Settings2 className="w-3 h-3 mr-1" />
                  <span>Config</span>
                </TabsTrigger>
                <TabsTrigger value="layout" className="text-xs h-6.5 rounded-md data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-xs transition-all">
                  <Move className="w-3 h-3 mr-1" />
                  <span>Bounds</span>
                </TabsTrigger>
              </TabsList>

              {/* Tab 1: Properties */}
              <TabsContent value="properties" className="space-y-3 mt-3">
                {registryEntry.propertySchema.map((entry) => {
                  const val = selectedNode.props[entry.key];

                  switch (entry.type) {
                    case 'string':
                      return (
                        <div key={entry.key} className="space-y-1.5">
                          <Label className="text-xs text-zinc-300 font-medium">
                            {entry.label}
                          </Label>
                          <Input
                            type="text"
                            value={String(val ?? '')}
                            onChange={(e) => handlePropChange(entry.key, e.target.value)}
                            className="h-8 text-xs bg-white/[0.03] border-white/[0.1] focus:border-indigo-500/70 focus:ring-1 focus:ring-indigo-500/30 rounded-lg text-zinc-100"
                          />
                        </div>
                      );

                    case 'number':
                      return (
                        <div key={entry.key} className="space-y-1.5">
                          <Label className="text-xs text-zinc-300 font-medium">
                            {entry.label}
                          </Label>
                          <Input
                            type="number"
                            value={Number(val ?? 0)}
                            onChange={(e) => handlePropChange(entry.key, Number(e.target.value))}
                            className="h-8 text-xs font-mono bg-white/[0.03] border-white/[0.1] focus:border-indigo-500/70 focus:ring-1 focus:ring-indigo-500/30 rounded-lg text-zinc-100"
                          />
                        </div>
                      );

                    case 'boolean':
                      return (
                        <div
                          key={entry.key}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.025] border border-white/[0.06]"
                        >
                          <Label className="text-xs text-zinc-300 font-medium cursor-pointer">
                            {entry.label}
                          </Label>
                          <Switch
                            checked={Boolean(val)}
                            onCheckedChange={(checked) => handlePropChange(entry.key, checked)}
                            className="data-[state=checked]:bg-indigo-600"
                          />
                        </div>
                      );

                    case 'color':
                      return (
                        <div key={entry.key} className="space-y-1.5">
                          <Label className="text-xs text-zinc-300 font-medium">
                            {entry.label}
                          </Label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={String(val ?? '#ffffff')}
                              onChange={(e) => handlePropChange(entry.key, e.target.value)}
                              className="w-8 h-8 p-0.5 border border-white/[0.1] rounded-lg bg-transparent cursor-pointer"
                            />
                            <Input
                              type="text"
                              value={String(val ?? '#ffffff')}
                              onChange={(e) => handlePropChange(entry.key, e.target.value)}
                              className="h-8 text-xs font-mono uppercase bg-white/[0.03] border-white/[0.1] focus:border-indigo-500/70 focus:ring-1 focus:ring-indigo-500/30 rounded-lg text-zinc-100"
                            />
                          </div>
                        </div>
                      );

                    default:
                      return null;
                  }
                })}
              </TabsContent>

              {/* Tab 2: Layout Coordinates */}
              <TabsContent value="layout" className="space-y-3 mt-3">
                {selectedNode.layout ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="space-y-1.5">
                        <Label className="text-[11px] text-zinc-400 font-medium flex items-center gap-1">
                          <span className="w-4 h-4 rounded bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px] font-mono">X</span>
                          <span>Position X</span>
                        </Label>
                        <Input
                          type="number"
                          value={selectedNode.layout.x}
                          onChange={(e) =>
                            moveComponent(
                              selectedNode.id,
                              Number(e.target.value),
                              selectedNode.layout!.y
                            )
                          }
                          className="h-8 text-xs font-mono bg-white/[0.03] border-white/[0.1] focus:border-indigo-500/70 rounded-lg"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-[11px] text-zinc-400 font-medium flex items-center gap-1">
                          <span className="w-4 h-4 rounded bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px] font-mono">Y</span>
                          <span>Position Y</span>
                        </Label>
                        <Input
                          type="number"
                          value={selectedNode.layout.y}
                          onChange={(e) =>
                            moveComponent(
                              selectedNode.id,
                              selectedNode.layout!.x,
                              Number(e.target.value)
                            )
                          }
                          className="h-8 text-xs font-mono bg-white/[0.03] border-white/[0.1] focus:border-indigo-500/70 rounded-lg"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-[11px] text-zinc-400 font-medium flex items-center gap-1">
                          <span className="w-4 h-4 rounded bg-purple-500/20 text-purple-400 flex items-center justify-center text-[10px] font-mono">W</span>
                          <span>Width</span>
                        </Label>
                        <Input
                          type="number"
                          value={selectedNode.layout.width}
                          onChange={(e) =>
                            resizeComponent(
                              selectedNode.id,
                              Number(e.target.value),
                              selectedNode.layout!.height
                            )
                          }
                          className="h-8 text-xs font-mono bg-white/[0.03] border-white/[0.1] focus:border-indigo-500/70 rounded-lg"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-[11px] text-zinc-400 font-medium flex items-center gap-1">
                          <span className="w-4 h-4 rounded bg-purple-500/20 text-purple-400 flex items-center justify-center text-[10px] font-mono">H</span>
                          <span>Height</span>
                        </Label>
                        <Input
                          type="number"
                          value={selectedNode.layout.height}
                          onChange={(e) =>
                            resizeComponent(
                              selectedNode.id,
                              selectedNode.layout!.width,
                              Number(e.target.value)
                            )
                          }
                          className="h-8 text-xs font-mono bg-white/[0.03] border-white/[0.1] focus:border-indigo-500/70 rounded-lg"
                        />
                      </div>
                    </div>

                    <Separator className="bg-white/[0.06]" />

                    <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06] text-[11px] text-zinc-400 flex items-center gap-2">
                      <Box className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span>Bounds are emitted as <code>setBounds(x, y, w, h)</code></span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-zinc-400">Frame Width</Label>
                        <Input
                          type="number"
                          value={Number(selectedNode.props.width || 500)}
                          onChange={(e) =>
                            resizeComponent(
                              selectedNode.id,
                              Number(e.target.value),
                              Number(selectedNode.props.height || 360)
                            )
                          }
                          className="h-8 text-xs font-mono bg-white/[0.03] border-white/[0.1] rounded-lg"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs text-zinc-400">Frame Height</Label>
                        <Input
                          type="number"
                          value={Number(selectedNode.props.height || 360)}
                          onChange={(e) =>
                            resizeComponent(
                              selectedNode.id,
                              Number(selectedNode.props.width || 500),
                              Number(e.target.value)
                            )
                          }
                          className="h-8 text-xs font-mono bg-white/[0.03] border-white/[0.1] rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {/* Quick Component Removal Action in Inspector */}
            {selectedNode.id !== rootId && (
              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeComponent(selectedNode.id)}
                  className="w-full text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border-rose-500/20 hover:border-rose-500/40 rounded-lg gap-1.5 h-8 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Component</span>
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

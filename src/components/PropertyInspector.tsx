import React from 'react';
import { SlidersHorizontal, Info, Move, Settings2 } from 'lucide-react';
import { useBuilderStore } from '../store/useBuilderStore';
import { COMPONENT_REGISTRY } from '../registry/componentRegistry';
import { CanvasNode, PropertyValue } from '../types/builder';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Separator } from './ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';

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
    <div className="w-[290px] h-full bg-background border-l border-border flex flex-col select-none shrink-0 z-10">
      {/* Header */}
      <div className="h-10 px-3.5 border-b border-border flex items-center justify-between bg-muted/20">
        <div className="flex items-center gap-2 text-xs font-semibold text-foreground/90 tracking-wide uppercase">
          <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
          <span>Inspector</span>
        </div>
        {selectedNode && (
          <Badge variant="outline" className="text-[10px] px-2 h-4 font-mono font-medium text-sky-400 border-sky-500/30">
            {selectedNode.type}
          </Badge>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {!selectedNode || !registryEntry ? (
          <div className="p-6 text-center text-xs text-muted-foreground space-y-2.5 mt-8 border border-dashed border-border/60 rounded-lg">
            <Info className="w-7 h-7 mx-auto text-muted-foreground/60" />
            <p className="font-semibold text-foreground/80">No Selection</p>
            <p className="text-[11px] text-muted-foreground/80 leading-relaxed">
              Click any component on the canvas to inspect and edit its Java Swing properties.
            </p>
          </div>
        ) : (
          <>
            {/* Selected Component Header Card */}
            <div className="p-3 rounded-lg bg-muted/30 border border-border/70 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
                  Variable Name
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  id: {selectedNode.id.slice(0, 6)}
                </span>
              </div>
              <div className="text-sm font-semibold font-mono text-foreground flex items-center gap-1.5">
                <span className="text-primary font-bold">#</span>
                <span>{selectedNode.varName}</span>
              </div>
            </div>

            {/* Tabs for Properties vs Layout */}
            <Tabs defaultValue="properties" className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-8 bg-muted/50 p-0.5">
                <TabsTrigger value="properties" className="text-xs gap-1.5 h-7">
                  <Settings2 className="w-3 h-3" />
                  <span>Properties</span>
                </TabsTrigger>
                <TabsTrigger value="layout" className="text-xs gap-1.5 h-7">
                  <Move className="w-3 h-3" />
                  <span>Layout</span>
                </TabsTrigger>
              </TabsList>

              {/* Tab 1: Swing Component Properties */}
              <TabsContent value="properties" className="space-y-3 mt-3">
                {registryEntry.propertySchema.map((entry) => {
                  const val = selectedNode.props[entry.key];

                  switch (entry.type) {
                    case 'string':
                      return (
                        <div key={entry.key} className="space-y-1.5">
                          <Label className="flex items-center justify-between text-xs">
                            <span>{entry.label}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">{entry.key}</span>
                          </Label>
                          <Input
                            type="text"
                            value={String(val ?? '')}
                            onChange={(e) => handlePropChange(entry.key, e.target.value)}
                            className="h-7 text-xs bg-muted/20 border-border/80 focus-visible:ring-primary"
                          />
                        </div>
                      );

                    case 'number':
                      return (
                        <div key={entry.key} className="space-y-1.5">
                          <Label className="flex items-center justify-between text-xs">
                            <span>{entry.label}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">{entry.key}</span>
                          </Label>
                          <Input
                            type="number"
                            value={Number(val ?? 0)}
                            onChange={(e) => handlePropChange(entry.key, Number(e.target.value))}
                            className="h-7 text-xs bg-muted/20 border-border/80 focus-visible:ring-primary"
                          />
                        </div>
                      );

                    case 'boolean':
                      return (
                        <div
                          key={entry.key}
                          className="flex items-center justify-between p-2.5 rounded-md bg-muted/30 border border-border/60"
                        >
                          <div className="space-y-0.5">
                            <Label className="text-xs">{entry.label}</Label>
                            <div className="text-[10px] text-muted-foreground font-mono">{entry.key}</div>
                          </div>
                          <Switch
                            checked={Boolean(val)}
                            onCheckedChange={(checked) => handlePropChange(entry.key, checked)}
                          />
                        </div>
                      );

                    case 'color':
                      return (
                        <div key={entry.key} className="space-y-1.5">
                          <Label className="flex items-center justify-between text-xs">
                            <span>{entry.label}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">{entry.key}</span>
                          </Label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={String(val ?? '#ffffff')}
                              onChange={(e) => handlePropChange(entry.key, e.target.value)}
                              className="w-7 h-7 p-0 border border-border rounded-md bg-transparent cursor-pointer"
                            />
                            <Input
                              type="text"
                              value={String(val ?? '#ffffff')}
                              onChange={(e) => handlePropChange(entry.key, e.target.value)}
                              className="h-7 text-xs font-mono uppercase bg-muted/20 border-border/80"
                            />
                          </div>
                        </div>
                      );

                    default:
                      return null;
                  }
                })}
              </TabsContent>

              {/* Tab 2: Layout / Bounds */}
              <TabsContent value="layout" className="space-y-3 mt-3">
                {selectedNode.layout ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="space-y-1.5">
                        <Label className="text-xs">X Coordinate (px)</Label>
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
                          className="h-7 text-xs bg-muted/20 border-border/80"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs">Y Coordinate (px)</Label>
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
                          className="h-7 text-xs bg-muted/20 border-border/80"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs">Width (px)</Label>
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
                          className="h-7 text-xs bg-muted/20 border-border/80"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs">Height (px)</Label>
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
                          className="h-7 text-xs bg-muted/20 border-border/80"
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="p-2.5 rounded-md bg-muted/20 border border-border/50 text-[11px] text-muted-foreground flex items-center gap-2">
                      <Info className="w-3.5 h-3.5 shrink-0 text-primary" />
                      <span>Bounds are emitted as <code>setBounds(x, y, w, h)</code>.</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Frame Width</Label>
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
                          className="h-7 text-xs bg-muted/20 border-border/80"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs">Frame Height</Label>
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
                          className="h-7 text-xs bg-muted/20 border-border/80"
                        />
                      </div>
                    </div>

                    <div className="p-2.5 rounded-md bg-muted/20 border border-border/50 text-[11px] text-muted-foreground flex items-center gap-2">
                      <Info className="w-3.5 h-3.5 shrink-0 text-sky-400" />
                      <span>Root JFrame layout is set to <code>null</code> (Absolute).</span>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
};

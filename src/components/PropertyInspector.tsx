import { Info, Move, Settings2 } from 'lucide-react';
import { useBuilderStore } from '../store/useBuilderStore';
import { COMPONENT_REGISTRY } from '../registry/componentRegistry';
import { CanvasNode, PropertyValue } from '../types/builder';
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
    <div className="w-[280px] h-full bg-background border-l border-border flex flex-col select-none shrink-0 z-10">
      {/* Header */}
      <div className="h-10 px-3.5 border-b border-border flex items-center justify-between">
        <span className="text-xs font-medium text-foreground tracking-tight">
          Properties
        </span>
        {selectedNode && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-[3px] bg-[#132230] text-[#7dd3fc] border border-[#1e3a5f]">
            {selectedNode.type}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {!selectedNode || !registryEntry ? (
          <div className="p-6 text-center text-xs text-muted-foreground space-y-2 mt-8 border border-dashed border-border rounded-[4px]">
            <Info className="w-5 h-5 mx-auto text-muted-foreground/60" />
            <p className="font-medium text-foreground/80">No element selected</p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Click any element on canvas to modify properties.
            </p>
          </div>
        ) : (
          <>
            {/* Identity Card */}
            <div className="p-2.5 rounded-[4px] bg-card border border-border space-y-1">
              <div className="text-[10px] font-mono uppercase text-muted-foreground flex justify-between">
                <span>Variable</span>
                <span>id: {selectedNode.id.slice(0, 6)}</span>
              </div>
              <div className="text-xs font-semibold font-mono text-foreground">
                {selectedNode.varName}
              </div>
            </div>

            {/* Flat Tabs */}
            <Tabs defaultValue="properties" className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-7 bg-secondary p-0.5 rounded-[3px]">
                <TabsTrigger value="properties" className="text-xs h-6 rounded-[2px] font-normal">
                  <Settings2 className="w-3 h-3 mr-1.5" />
                  <span>Config</span>
                </TabsTrigger>
                <TabsTrigger value="layout" className="text-xs h-6 rounded-[2px] font-normal">
                  <Move className="w-3 h-3 mr-1.5" />
                  <span>Layout</span>
                </TabsTrigger>
              </TabsList>

              {/* Tab 1: Properties */}
              <TabsContent value="properties" className="space-y-3 mt-2.5">
                {registryEntry.propertySchema.map((entry) => {
                  const val = selectedNode.props[entry.key];

                  switch (entry.type) {
                    case 'string':
                      return (
                        <div key={entry.key} className="space-y-1">
                          <Label className="flex items-center justify-between text-xs font-normal">
                            <span>{entry.label}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">{entry.key}</span>
                          </Label>
                          <Input
                            type="text"
                            value={String(val ?? '')}
                            onChange={(e) => handlePropChange(entry.key, e.target.value)}
                            className="h-7 text-xs bg-card border-border rounded-[3px] font-sans"
                          />
                        </div>
                      );

                    case 'number':
                      return (
                        <div key={entry.key} className="space-y-1">
                          <Label className="flex items-center justify-between text-xs font-normal">
                            <span>{entry.label}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">{entry.key}</span>
                          </Label>
                          <Input
                            type="number"
                            value={Number(val ?? 0)}
                            onChange={(e) => handlePropChange(entry.key, Number(e.target.value))}
                            className="h-7 text-xs bg-card border-border rounded-[3px] font-mono"
                          />
                        </div>
                      );

                    case 'boolean':
                      return (
                        <div
                          key={entry.key}
                          className="flex items-center justify-between p-2 rounded-[4px] bg-card border border-border"
                        >
                          <div className="space-y-0.5">
                            <Label className="text-xs font-normal">{entry.label}</Label>
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
                        <div key={entry.key} className="space-y-1">
                          <Label className="flex items-center justify-between text-xs font-normal">
                            <span>{entry.label}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">{entry.key}</span>
                          </Label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={String(val ?? '#ffffff')}
                              onChange={(e) => handlePropChange(entry.key, e.target.value)}
                              className="w-7 h-7 p-0 border border-border rounded-[3px] bg-transparent cursor-pointer"
                            />
                            <Input
                              type="text"
                              value={String(val ?? '#ffffff')}
                              onChange={(e) => handlePropChange(entry.key, e.target.value)}
                              className="h-7 text-xs font-mono uppercase bg-card border-border rounded-[3px]"
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
              <TabsContent value="layout" className="space-y-3 mt-2.5">
                {selectedNode.layout ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-[11px] font-normal text-muted-foreground">X Position</Label>
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
                          className="h-7 text-xs font-mono bg-card border-border rounded-[3px]"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[11px] font-normal text-muted-foreground">Y Position</Label>
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
                          className="h-7 text-xs font-mono bg-card border-border rounded-[3px]"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[11px] font-normal text-muted-foreground">Width (px)</Label>
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
                          className="h-7 text-xs font-mono bg-card border-border rounded-[3px]"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[11px] font-normal text-muted-foreground">Height (px)</Label>
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
                          className="h-7 text-xs font-mono bg-card border-border rounded-[3px]"
                        />
                      </div>
                    </div>

                    <Separator className="bg-border/60" />

                    <div className="p-2 rounded-[3px] bg-secondary/50 text-[10px] font-mono text-muted-foreground">
                      setBounds(x, y, w, h)
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-[11px] font-normal text-muted-foreground">Frame Width</Label>
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
                          className="h-7 text-xs font-mono bg-card border-border rounded-[3px]"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[11px] font-normal text-muted-foreground">Frame Height</Label>
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
                          className="h-7 text-xs font-mono bg-card border-border rounded-[3px]"
                        />
                      </div>
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

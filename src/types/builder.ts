export type PropertyValue = string | number | boolean;

export interface ElementProperties {
  [propKey: string]: PropertyValue;
}

export interface LayoutBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CanvasNode {
  id: string;                    // unique, e.g. nanoid(10)
  type: string;                  // MUST match a key in Component Registry, e.g. "JButton"
  varName: string;               // stable generated Java variable name, e.g. "jButton1"
  props: ElementProperties;      // conforming to propertySchema
  layout: LayoutBounds | null;   // null for root JFrame, required for all other nodes
  children: CanvasNode[];        // empty array for non-container types
}

export interface BuilderState {
  rootId: string | null;
  tree: CanvasNode | null;
  selectedComponentId: string | null;
  generatedCode: string;
  codeLineMap: Record<string, { startLine: number; endLine: number }>;

  // Actions (strictly conforming to FR-1.5)
  addComponent: (parentId: string, type: string, layout?: Partial<LayoutBounds>) => string;
  updateComponentProp: (id: string, key: string, value: PropertyValue) => void;
  moveComponent: (id: string, x: number, y: number) => void;
  resizeComponent: (id: string, width: number, height: number) => void;
  removeComponent: (id: string) => void;
  selectComponent: (id: string | null) => void;
  loadTree: (tree: CanvasNode, rootId: string) => void;
  
  // Internal action for codegen sync
  _setGeneratedCode: (code: string, lineMap: Record<string, { startLine: number; endLine: number }>) => void;
}

export interface BuilderPersistedState {
  schemaVersion: 1;
  rootId: string;
  tree: CanvasNode;
}

export type PropertyType = "string" | "number" | "boolean" | "color";

export interface PropertySchemaEntry {
  key: string;
  label: string;
  type: PropertyType;
}

export interface ComponentRegistryEntry {
  type: string;
  label: string;
  icon: string;
  isContainer: boolean;
  defaultProps: ElementProperties;
  defaultLayout: LayoutBounds | null;
  propertySchema: PropertySchemaEntry[];
  javaImport: string;
  codeTemplate: (node: CanvasNode) => string;
}

export type ComponentRegistry = Record<string, ComponentRegistryEntry>;

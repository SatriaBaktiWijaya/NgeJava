import { create } from 'zustand';
import { nanoid } from 'nanoid';
import { 
  BuilderState, 
  CanvasNode, 
  PropertyValue, 
  LayoutBounds 
} from '../types/builder';
import { COMPONENT_REGISTRY } from '../registry/componentRegistry';
import { generateJavaCode } from '../codegen/generateJavaCode';
import { recordSnapshot } from './history';

// Type-scoped varName counter storage (stable across the session lifetime, never decrements)
const varCounters: Record<string, number> = {};

function getNextVarName(type: string): string {
  const current = varCounters[type] || 0;
  const next = current + 1;
  varCounters[type] = next;
  const prefix = type.charAt(0).toLowerCase() + type.slice(1);
  return `${prefix}${next}`;
}

// Tree traversal utilities (Pure & Immutable)
function findNode(root: CanvasNode | null, id: string): CanvasNode | null {
  if (!root) return null;
  if (root.id === id) return root;
  for (const child of root.children) {
    const found = findNode(child, id);
    if (found) return found;
  }
  return null;
}

function updateNodeImmutable(
  root: CanvasNode,
  targetId: string,
  updater: (node: CanvasNode) => CanvasNode
): CanvasNode {
  if (root.id === targetId) {
    return updater(root);
  }
  let hasChanged = false;
  const newChildren = root.children.map((child) => {
    const updated = updateNodeImmutable(child, targetId, updater);
    if (updated !== child) {
      hasChanged = true;
    }
    return updated;
  });

  return hasChanged ? { ...root, children: newChildren } : root;
}

function deleteNodeImmutable(root: CanvasNode, targetId: string): CanvasNode | null {
  if (root.id === targetId) {
    return null;
  }
  let hasChanged = false;
  const newChildren: CanvasNode[] = [];
  for (const child of root.children) {
    if (child.id === targetId) {
      hasChanged = true;
      continue;
    }
    const updated = deleteNodeImmutable(child, targetId);
    if (updated !== child) {
      hasChanged = true;
    }
    if (updated) {
      newChildren.push(updated);
    }
  }

  return hasChanged ? { ...root, children: newChildren } : root;
}

function createInitialRoot(): { rootId: string; rootNode: CanvasNode } {
  const rootId = 'frame-root';
  const varName = getNextVarName('JFrame');
  const entry = COMPONENT_REGISTRY['JFrame'];

  const rootNode: CanvasNode = {
    id: rootId,
    type: 'JFrame',
    varName,
    props: { ...entry.defaultProps },
    layout: null,
    children: [],
  };

  return { rootId, rootNode };
}

const initial = createInitialRoot();
const initialCodegen = generateJavaCode(initial.rootNode, COMPONENT_REGISTRY);

export const useBuilderStore = create<BuilderState>((set, get) => ({
  rootId: initial.rootId,
  tree: initial.rootNode,
  selectedComponentId: initial.rootId,
  generatedCode: initialCodegen.code,
  codeLineMap: initialCodegen.lineMap,

  addComponent: (parentId: string, type: string, layoutOverride?: Partial<LayoutBounds>) => {
    const state = get();
    if (!state.tree || !state.rootId) {
      // If no root and adding JFrame, initialize root
      if (type === 'JFrame') {
        const newRootId = nanoid(10);
        const varName = getNextVarName('JFrame');
        const entry = COMPONENT_REGISTRY['JFrame'];
        const newRoot: CanvasNode = {
          id: newRootId,
          type: 'JFrame',
          varName,
          props: { ...entry.defaultProps },
          layout: null,
          children: [],
        };
        const codegen = generateJavaCode(newRoot, COMPONENT_REGISTRY);
        set({
          rootId: newRootId,
          tree: newRoot,
          selectedComponentId: newRootId,
          generatedCode: codegen.code,
          codeLineMap: codegen.lineMap,
        });
        return newRootId;
      }
      return '';
    }

    // Constraint: Only ONE JFrame allowed in entire tree (FR-1.6.1)
    if (type === 'JFrame') {
      console.warn('Cannot add a second JFrame. Only one JFrame is allowed as root.');
      return '';
    }

    const parentNode = findNode(state.tree, parentId);
    if (!parentNode) {
      console.warn(`Parent node with id "${parentId}" not found.`);
      return '';
    }

    const parentEntry = COMPONENT_REGISTRY[parentNode.type];
    if (!parentEntry || !parentEntry.isContainer) {
      console.warn(`Parent node "${parentNode.type}" is not a container.`);
      return '';
    }

    const registryEntry = COMPONENT_REGISTRY[type];
    if (!registryEntry) {
      console.warn(`Component type "${type}" is not registered in COMPONENT_REGISTRY.`);
      return '';
    }

    recordSnapshot();
    const newId = nanoid(10);
    const varName = getNextVarName(type);

    const defaultBounds: LayoutBounds = registryEntry.defaultLayout ?? {
      x: 20,
      y: 20,
      width: 100,
      height: 30,
    };

    const finalLayout: LayoutBounds = {
      x: layoutOverride?.x !== undefined ? Math.max(0, layoutOverride.x) : defaultBounds.x,
      y: layoutOverride?.y !== undefined ? Math.max(0, layoutOverride.y) : defaultBounds.y,
      width: layoutOverride?.width !== undefined ? Math.max(20, layoutOverride.width) : defaultBounds.width,
      height: layoutOverride?.height !== undefined ? Math.max(20, layoutOverride.height) : defaultBounds.height,
    };

    const newNode: CanvasNode = {
      id: newId,
      type,
      varName,
      props: { ...registryEntry.defaultProps },
      layout: finalLayout,
      children: [],
    };

    const updatedTree = updateNodeImmutable(state.tree, parentId, (parent) => ({
      ...parent,
      children: [...parent.children, newNode],
    }));

    const codegen = generateJavaCode(updatedTree, COMPONENT_REGISTRY);

    set({
      tree: updatedTree,
      selectedComponentId: newId,
      generatedCode: codegen.code,
      codeLineMap: codegen.lineMap,
    });

    return newId;
  },

  updateComponentProp: (id: string, key: string, value: PropertyValue) => {
    const state = get();
    if (!state.tree) return;

    const targetNode = findNode(state.tree, id);
    if (!targetNode) return;

    const entry = COMPONENT_REGISTRY[targetNode.type];
    if (!entry) return;

    // Validate key against propertySchema (FR-1.5.2)
    const isValidKey = entry.propertySchema.some((schema) => schema.key === key);
    if (!isValidKey) {
      console.warn(`Property "${key}" is not in propertySchema for ${targetNode.type}.`);
      return;
    }

    recordSnapshot();
    const updatedTree = updateNodeImmutable(state.tree, id, (node) => ({
      ...node,
      props: {
        ...node.props,
        [key]: value,
      },
    }));

    const codegen = generateJavaCode(updatedTree, COMPONENT_REGISTRY);

    set({
      tree: updatedTree,
      generatedCode: codegen.code,
      codeLineMap: codegen.lineMap,
    });
  },

  moveComponent: (id: string, x: number, y: number) => {
    const state = get();
    if (!state.tree || id === state.rootId) return;

    recordSnapshot();
    const updatedTree = updateNodeImmutable(state.tree, id, (node) => {
      if (!node.layout) return node;
      return {
        ...node,
        layout: {
          ...node.layout,
          x: Math.max(0, Math.round(x)),
          y: Math.max(0, Math.round(y)),
        },
      };
    });

    const codegen = generateJavaCode(updatedTree, COMPONENT_REGISTRY);

    set({
      tree: updatedTree,
      generatedCode: codegen.code,
      codeLineMap: codegen.lineMap,
    });
  },

  resizeComponent: (id: string, width: number, height: number) => {
    const state = get();
    if (!state.tree) return;

    recordSnapshot();
    // If resizing root JFrame
    if (id === state.rootId) {
      const updatedTree = {
        ...state.tree,
        props: {
          ...state.tree.props,
          width: Math.max(200, Math.round(width)),
          height: Math.max(150, Math.round(height)),
        },
      };
      const codegen = generateJavaCode(updatedTree, COMPONENT_REGISTRY);
      set({
        tree: updatedTree,
        generatedCode: codegen.code,
        codeLineMap: codegen.lineMap,
      });
      return;
    }

    const updatedTree = updateNodeImmutable(state.tree, id, (node) => {
      if (!node.layout) return node;
      return {
        ...node,
        layout: {
          ...node.layout,
          width: Math.max(20, Math.round(width)),
          height: Math.max(20, Math.round(height)),
        },
      };
    });

    const codegen = generateJavaCode(updatedTree, COMPONENT_REGISTRY);

    set({
      tree: updatedTree,
      generatedCode: codegen.code,
      codeLineMap: codegen.lineMap,
    });
  },

  removeComponent: (id: string) => {
    const state = get();
    if (!state.tree) return;

    recordSnapshot();
    if (id === state.rootId) {
      set({
        rootId: null,
        tree: null,
        selectedComponentId: null,
        generatedCode: '// Canvas is empty. Add a JFrame to start.\n',
        codeLineMap: {},
      });
      return;
    }

    const updatedTree = deleteNodeImmutable(state.tree, id);
    const codegen = generateJavaCode(updatedTree, COMPONENT_REGISTRY);

    set({
      tree: updatedTree,
      selectedComponentId: state.selectedComponentId === id ? state.rootId : state.selectedComponentId,
      generatedCode: codegen.code,
      codeLineMap: codegen.lineMap,
    });
  },

  selectComponent: (id: string | null) => {
    set({ selectedComponentId: id });
  },

  loadTree: (loadedTree: CanvasNode, rootId: string) => {
    function scanCounters(node: CanvasNode) {
      const match = node.varName.match(/^([a-zA-Z]+)(\d+)$/);
      if (match) {
        const num = parseInt(match[2], 10);
        if (!isNaN(num)) {
          varCounters[node.type] = Math.max(varCounters[node.type] || 0, num);
        }
      }
      for (const child of node.children) {
        scanCounters(child);
      }
    }
    scanCounters(loadedTree);

    const codegen = generateJavaCode(loadedTree, COMPONENT_REGISTRY);

    set({
      rootId,
      tree: loadedTree,
      selectedComponentId: rootId,
      generatedCode: codegen.code,
      codeLineMap: codegen.lineMap,
    });
  },

  _setGeneratedCode: (code: string, lineMap: Record<string, { startLine: number; endLine: number }>) => {
    set({ generatedCode: code, codeLineMap: lineMap });
  },
}));

// Export helper for tests to reset counter if needed
export function _resetVarCounters() {
  Object.keys(varCounters).forEach((k) => delete varCounters[k]);
}

import { describe, it, expect, beforeEach } from 'vitest';
import { useBuilderStore, _resetVarCounters } from '../src/store/useBuilderStore';

describe('Zustand BuilderStore (Phase 2)', () => {
  beforeEach(() => {
    _resetVarCounters();
    const store = useBuilderStore.getState();
    // Re-initialize a clean root
    store.removeComponent(store.rootId || '');
    store.addComponent('', 'JFrame');
  });

  it('should initialize with exactly one JFrame root', () => {
    const state = useBuilderStore.getState();
    expect(state.rootId).toBeTruthy();
    expect(state.tree).not.toBeNull();
    expect(state.tree?.type).toBe('JFrame');
    expect(state.tree?.varName).toBe('jFrame1');
  });

  it('should reject adding a second JFrame (FR-1.6.1)', () => {
    const state = useBuilderStore.getState();
    const initialTree = state.tree;
    const secondFrameId = state.addComponent(state.rootId!, 'JFrame');

    expect(secondFrameId).toBe('');
    expect(useBuilderStore.getState().tree).toBe(initialTree);
  });

  it('should add components to container with seeded default props and layouts', () => {
    const store = useBuilderStore.getState();
    const rootId = store.rootId!;

    const btnId = store.addComponent(rootId, 'JButton', { x: 50, y: 80 });
    expect(btnId).toBeTruthy();

    const state = useBuilderStore.getState();
    const btnNode = state.tree?.children.find((c) => c.id === btnId);

    expect(btnNode).toBeDefined();
    expect(btnNode?.type).toBe('JButton');
    expect(btnNode?.varName).toBe('jButton1');
    expect(btnNode?.props.text).toBe('Button');
    expect(btnNode?.props.enabled).toBe(true);
    expect(btnNode?.layout?.x).toBe(50);
    expect(btnNode?.layout?.y).toBe(80);
    expect(btnNode?.layout?.width).toBe(100);
    expect(btnNode?.layout?.height).toBe(35);
    expect(state.selectedComponentId).toBe(btnId);
  });

  it('should guarantee stable monotonically increasing varName even after deletion (FR-1.5.4)', () => {
    const store = useBuilderStore.getState();
    const rootId = store.rootId!;

    const btn1Id = store.addComponent(rootId, 'JButton');
    expect(useBuilderStore.getState().tree?.children[0].varName).toBe('jButton1');

    // Delete jButton1
    store.removeComponent(btn1Id);
    expect(useBuilderStore.getState().tree?.children.length).toBe(0);

    // Add another button — must be jButton2, NOT reused jButton1!
    const btn2Id = store.addComponent(rootId, 'JButton');
    const btn2Node = useBuilderStore.getState().tree?.children.find((c) => c.id === btn2Id);
    expect(btn2Node?.varName).toBe('jButton2');
  });

  it('should reject adding a child to a non-container component', () => {
    const store = useBuilderStore.getState();
    const rootId = store.rootId!;

    const btnId = store.addComponent(rootId, 'JButton');
    expect(btnId).toBeTruthy();

    // Try adding a label as child of button
    const childId = store.addComponent(btnId, 'JLabel');
    expect(childId).toBe('');

    const btnNode = useBuilderStore.getState().tree?.children.find((c) => c.id === btnId);
    expect(btnNode?.children.length).toBe(0);
  });

  it('should allow nesting components inside JPanel', () => {
    const store = useBuilderStore.getState();
    const rootId = store.rootId!;

    const panelId = store.addComponent(rootId, 'JPanel');
    expect(panelId).toBeTruthy();

    const nestedBtnId = store.addComponent(panelId, 'JButton');
    expect(nestedBtnId).toBeTruthy();

    const state = useBuilderStore.getState();
    const panel = state.tree?.children.find((c) => c.id === panelId);
    expect(panel?.children.length).toBe(1);
    expect(panel?.children[0].id).toBe(nestedBtnId);
    expect(panel?.children[0].varName).toBe('jButton1');
  });

  it('should update component properties with schema validation (FR-1.5.2)', () => {
    const store = useBuilderStore.getState();
    const rootId = store.rootId!;

    const btnId = store.addComponent(rootId, 'JButton');
    store.updateComponentProp(btnId, 'text', 'Click Me');
    store.updateComponentProp(btnId, 'enabled', false);

    let node = useBuilderStore.getState().tree?.children.find((c) => c.id === btnId);
    expect(node?.props.text).toBe('Click Me');
    expect(node?.props.enabled).toBe(false);

    // Invalid property should be ignored
    store.updateComponentProp(btnId, 'nonExistentProp', 'hacker');
    node = useBuilderStore.getState().tree?.children.find((c) => c.id === btnId);
    expect(node?.props['nonExistentProp']).toBeUndefined();
  });

  it('should move and resize components with minimum bounds clamping', () => {
    const store = useBuilderStore.getState();
    const rootId = store.rootId!;

    const btnId = store.addComponent(rootId, 'JButton');
    store.moveComponent(btnId, 150, 220);

    let node = useBuilderStore.getState().tree?.children.find((c) => c.id === btnId);
    expect(node?.layout?.x).toBe(150);
    expect(node?.layout?.y).toBe(220);

    // Negative coordinates clamped to 0
    store.moveComponent(btnId, -50, -30);
    node = useBuilderStore.getState().tree?.children.find((c) => c.id === btnId);
    expect(node?.layout?.x).toBe(0);
    expect(node?.layout?.y).toBe(0);

    // Resize with minimum 20x20
    store.resizeComponent(btnId, 10, 5);
    node = useBuilderStore.getState().tree?.children.find((c) => c.id === btnId);
    expect(node?.layout?.width).toBe(20);
    expect(node?.layout?.height).toBe(20);
  });
});

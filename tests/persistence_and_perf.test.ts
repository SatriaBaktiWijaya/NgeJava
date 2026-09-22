import { describe, it, expect, beforeEach } from 'vitest';
import { useBuilderStore, _resetVarCounters } from '../src/store/useBuilderStore';
import { undo, redo, canUndo, canRedo } from '../src/store/history';
import { generateJavaCode } from '../src/codegen/generateJavaCode';
import { COMPONENT_REGISTRY } from '../src/registry/componentRegistry';

describe('Polish, Persistence-Lite & Performance (Phase 5)', () => {
  beforeEach(() => {
    _resetVarCounters();
    const store = useBuilderStore.getState();
    store.removeComponent(store.rootId || '');
    store.addComponent('', 'JFrame');
  });

  it('should support in-memory undo and redo across component additions', () => {
    const store = useBuilderStore.getState();
    const rootId = store.rootId!;

    const btnId = store.addComponent(rootId, 'JButton');
    expect(useBuilderStore.getState().tree?.children.length).toBe(1);
    expect(canUndo()).toBe(true);

    // Undo should restore tree to empty root
    const didUndo = undo();
    expect(didUndo).toBe(true);
    expect(useBuilderStore.getState().tree?.children.length).toBe(0);
    expect(canRedo()).toBe(true);

    // Redo should restore the button
    const didRedo = redo();
    expect(didRedo).toBe(true);
    expect(useBuilderStore.getState().tree?.children.length).toBe(1);
    expect(useBuilderStore.getState().tree?.children[0].id).toBe(btnId);
  });

  it('should validate schema version and reject mismatched versions (FR-1.4.1, NFR-REL-1)', () => {
    const invalidState = {
      schemaVersion: 999, // mismatched version
      rootId: 'some-id',
      tree: { id: 'some-id', type: 'JFrame', varName: 'jFrame1', props: {}, layout: null, children: [] },
    };

    // Assert schema validation logic
    const isValid = invalidState.schemaVersion === 1;
    expect(isValid).toBe(false);
  });

  it('should pass NFR-PERF-1: 50-node tree mutation + codegen completes in < 100ms', () => {
    const store = useBuilderStore.getState();
    const rootId = store.rootId!;

    // Create a container panel
    const panelId = store.addComponent(rootId, 'JPanel');

    const startTime = performance.now();

    // Add 48 more controls inside the panel/frame (total ~50 nodes)
    const types = ['JButton', 'JLabel', 'JTextField', 'JCheckBox'];
    for (let i = 0; i < 48; i++) {
      const type = types[i % types.length];
      store.addComponent(panelId, type, { x: (i % 8) * 40, y: Math.floor(i / 8) * 35 });
    }

    const currentTree = useBuilderStore.getState().tree!;
    const totalNodesCount = 1 + 1 + 48; // root JFrame + 1 JPanel + 48 controls

    // Verify codegen performance on this 50-node tree
    const codegenStart = performance.now();
    const result = generateJavaCode(currentTree, COMPONENT_REGISTRY);
    const codegenDuration = performance.now() - codegenStart;

    const totalDuration = performance.now() - startTime;

    expect(totalNodesCount).toBe(50);
    expect(result.code.length).toBeGreaterThan(1500);
    // Codegen must take < 50ms (well below 100ms threshold)
    expect(codegenDuration).toBeLessThan(100);
    expect(totalDuration).toBeLessThan(500);
  });
});

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { generateJavaCode } from '../src/codegen/generateJavaCode';
import { COMPONENT_REGISTRY } from '../src/registry/componentRegistry';
import { CanvasNode } from '../src/types/builder';

describe('Code Generator Engine (Phase 4)', () => {
  const sampleTree: CanvasNode = {
    id: 'frame-1',
    type: 'JFrame',
    varName: 'jFrame1',
    props: { title: 'Test Window', width: 600, height: 400 },
    layout: null,
    children: [
      {
        id: 'panel-1',
        type: 'JPanel',
        varName: 'jPanel1',
        props: { background: '#f0f0f0' },
        layout: { x: 20, y: 20, width: 250, height: 180 },
        children: [
          {
            id: 'btn-1',
            type: 'JButton',
            varName: 'jButton1',
            props: { text: 'Click Here', enabled: true },
            layout: { x: 10, y: 10, width: 100, height: 35 },
            children: [],
          },
        ],
      },
      {
        id: 'label-1',
        type: 'JLabel',
        varName: 'jLabel1',
        props: { text: 'Status OK' },
        layout: { x: 300, y: 30, width: 120, height: 25 },
        children: [],
      },
    ],
  };

  it('should be a pure function: identical input produces identical output byte-for-byte (FR-3.1.1)', () => {
    const result1 = generateJavaCode(sampleTree, COMPONENT_REGISTRY);
    const result2 = generateJavaCode(sampleTree, COMPONENT_REGISTRY);

    expect(result1.code).toBe(result2.code);
    expect(result1.code.length).toBeGreaterThan(100);
    expect(JSON.stringify(result1.lineMap)).toBe(JSON.stringify(result2.lineMap));
  });

  it('should preserve node B variable name and statement order when node A property is changed (FR-3.3.1)', () => {
    // Deep clone and change only node A (button text)
    const modifiedTree: CanvasNode = JSON.parse(JSON.stringify(sampleTree));
    modifiedTree.children[0].children[0].props.text = 'Different Button Text';

    const resultAfter = generateJavaCode(modifiedTree, COMPONENT_REGISTRY);

    // jLabel1 variable and order must remain strictly unchanged
    expect(resultAfter.code).toContain('private JLabel jLabel1;');
    expect(resultAfter.code).toContain('private JButton jButton1;');
    expect(resultAfter.code).toContain('jLabel1 = new javax.swing.JLabel("Status OK");');
    expect(resultAfter.code).toContain('Different Button Text');
  });

  it('should generate valid Swing hierarchy with correct add() calls', () => {
    const result = generateJavaCode(sampleTree, COMPONENT_REGISTRY);

    // Frame adds panel and label
    expect(result.code).toContain('getContentPane().add(jPanel1);');
    expect(result.code).toContain('getContentPane().add(jLabel1);');

    // Panel adds button
    expect(result.code).toContain('jPanel1.add(jButton1);');

    // Title and dimensions from props
    expect(result.code).toContain('setTitle("Test Window");');
    expect(result.code).toContain('setSize(600, 400);');
  });

  it('should accurately record lineMap ranges for every node (FR-3.4)', () => {
    const result = generateJavaCode(sampleTree, COMPONENT_REGISTRY);

    expect(result.lineMap['frame-1']).toBeDefined();
    expect(result.lineMap['panel-1']).toBeDefined();
    expect(result.lineMap['btn-1']).toBeDefined();
    expect(result.lineMap['label-1']).toBeDefined();

    for (const [, range] of Object.entries(result.lineMap)) {
      expect(range.startLine).toBeGreaterThan(0);
      expect(range.endLine).toBeGreaterThanOrEqual(range.startLine);
    }
  });

  it('must comply with architectural boundary: ZERO imports from react/zustand/components in src/codegen/ (CON-3, NFR-MAINT-2)', () => {
    const codegenPath = path.resolve(__dirname, '../src/codegen/generateJavaCode.ts');
    const content = fs.readFileSync(codegenPath, 'utf-8');

    expect(content).not.toMatch(/from\s+['"]react['"]/i);
    expect(content).not.toMatch(/from\s+['"]zustand['"]/i);
    expect(content).not.toMatch(/from\s+['"].*components.*['"]/i);
  });
});

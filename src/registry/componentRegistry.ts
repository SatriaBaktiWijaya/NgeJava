import { ComponentRegistry } from '../types/builder';

export const COMPONENT_REGISTRY: ComponentRegistry = {
  JFrame: {
    type: 'JFrame',
    label: 'JFrame',
    icon: 'Square',
    isContainer: true,
    defaultProps: {
      title: 'GeneratedForm',
      width: 500,
      height: 360,
    },
    defaultLayout: null,
    propertySchema: [
      { key: 'title', label: 'Title', type: 'string' },
      { key: 'width', label: 'Width (px)', type: 'number' },
      { key: 'height', label: 'Height (px)', type: 'number' },
    ],
    javaImport: 'javax.swing.JFrame',
    codeTemplate: (node) => {
      const title = JSON.stringify(String(node.props.title ?? 'GeneratedForm'));
      const width = Number(node.props.width ?? 500);
      const height = Number(node.props.height ?? 360);
      return [
        `setTitle(${title});`,
        `setDefaultCloseOperation(javax.swing.WindowConstants.EXIT_ON_CLOSE);`,
        `setLayout(null);`,
        `setSize(${width}, ${height});`,
        `setLocationRelativeTo(null);`,
      ].join('\n');
    },
  },

  JPanel: {
    type: 'JPanel',
    label: 'JPanel',
    icon: 'Layers',
    isContainer: true,
    defaultProps: {
      background: '#ffffff',
    },
    defaultLayout: {
      x: 20,
      y: 20,
      width: 240,
      height: 160,
    },
    propertySchema: [
      { key: 'background', label: 'Background Color', type: 'color' },
    ],
    javaImport: 'javax.swing.JPanel',
    codeTemplate: (node) => {
      const lines = [
        `${node.varName} = new javax.swing.JPanel();`,
        `${node.varName}.setLayout(null);`,
      ];
      if (node.layout) {
        lines.push(`${node.varName}.setBounds(${node.layout.x}, ${node.layout.y}, ${node.layout.width}, ${node.layout.height});`);
      }
      if (node.props.background && node.props.background !== '#ffffff') {
        const hex = String(node.props.background).replace('#', '');
        lines.push(`${node.varName}.setBackground(new java.awt.Color(0x${hex}));`);
      }
      return lines.join('\n');
    },
  },

  JButton: {
    type: 'JButton',
    label: 'JButton',
    icon: 'MousePointerClick',
    isContainer: false,
    defaultProps: {
      text: 'Button',
      enabled: true,
    },
    defaultLayout: {
      x: 20,
      y: 20,
      width: 100,
      height: 35,
    },
    propertySchema: [
      { key: 'text', label: 'Text', type: 'string' },
      { key: 'enabled', label: 'Enabled', type: 'boolean' },
    ],
    javaImport: 'javax.swing.JButton',
    codeTemplate: (node) => {
      const text = JSON.stringify(String(node.props.text ?? 'Button'));
      const lines = [
        `${node.varName} = new javax.swing.JButton(${text});`,
      ];
      if (node.layout) {
        lines.push(`${node.varName}.setBounds(${node.layout.x}, ${node.layout.y}, ${node.layout.width}, ${node.layout.height});`);
      }
      if (node.props.enabled === false) {
        lines.push(`${node.varName}.setEnabled(false);`);
      }
      return lines.join('\n');
    },
  },

  JLabel: {
    type: 'JLabel',
    label: 'JLabel',
    icon: 'Type',
    isContainer: false,
    defaultProps: {
      text: 'Label',
    },
    defaultLayout: {
      x: 20,
      y: 20,
      width: 100,
      height: 25,
    },
    propertySchema: [
      { key: 'text', label: 'Text', type: 'string' },
    ],
    javaImport: 'javax.swing.JLabel',
    codeTemplate: (node) => {
      const text = JSON.stringify(String(node.props.text ?? 'Label'));
      const lines = [
        `${node.varName} = new javax.swing.JLabel(${text});`,
      ];
      if (node.layout) {
        lines.push(`${node.varName}.setBounds(${node.layout.x}, ${node.layout.y}, ${node.layout.width}, ${node.layout.height});`);
      }
      return lines.join('\n');
    },
  },

  JTextField: {
    type: 'JTextField',
    label: 'JTextField',
    icon: 'FormInput',
    isContainer: false,
    defaultProps: {
      text: '',
      columns: 10,
    },
    defaultLayout: {
      x: 20,
      y: 20,
      width: 120,
      height: 30,
    },
    propertySchema: [
      { key: 'text', label: 'Text', type: 'string' },
      { key: 'columns', label: 'Columns', type: 'number' },
    ],
    javaImport: 'javax.swing.JTextField',
    codeTemplate: (node) => {
      const text = JSON.stringify(String(node.props.text ?? ''));
      const cols = Number(node.props.columns ?? 10);
      const lines = [
        `${node.varName} = new javax.swing.JTextField(${text}, ${cols});`,
      ];
      if (node.layout) {
        lines.push(`${node.varName}.setBounds(${node.layout.x}, ${node.layout.y}, ${node.layout.width}, ${node.layout.height});`);
      }
      return lines.join('\n');
    },
  },

  JTextArea: {
    type: 'JTextArea',
    label: 'JTextArea',
    icon: 'AlignLeft',
    isContainer: false,
    defaultProps: {
      text: '',
      rows: 4,
      columns: 20,
    },
    defaultLayout: {
      x: 20,
      y: 20,
      width: 160,
      height: 80,
    },
    propertySchema: [
      { key: 'text', label: 'Text', type: 'string' },
      { key: 'rows', label: 'Rows', type: 'number' },
      { key: 'columns', label: 'Columns', type: 'number' },
    ],
    javaImport: 'javax.swing.JTextArea',
    codeTemplate: (node) => {
      const text = JSON.stringify(String(node.props.text ?? ''));
      const rows = Number(node.props.rows ?? 4);
      const cols = Number(node.props.columns ?? 20);
      const lines = [
        `${node.varName} = new javax.swing.JTextArea(${text}, ${rows}, ${cols});`,
      ];
      if (node.layout) {
        lines.push(`${node.varName}.setBounds(${node.layout.x}, ${node.layout.y}, ${node.layout.width}, ${node.layout.height});`);
      }
      return lines.join('\n');
    },
  },

  JCheckBox: {
    type: 'JCheckBox',
    label: 'JCheckBox',
    icon: 'CheckSquare',
    isContainer: false,
    defaultProps: {
      text: 'CheckBox',
      selected: false,
    },
    defaultLayout: {
      x: 20,
      y: 20,
      width: 110,
      height: 28,
    },
    propertySchema: [
      { key: 'text', label: 'Text', type: 'string' },
      { key: 'selected', label: 'Selected', type: 'boolean' },
    ],
    javaImport: 'javax.swing.JCheckBox',
    codeTemplate: (node) => {
      const text = JSON.stringify(String(node.props.text ?? 'CheckBox'));
      const selected = Boolean(node.props.selected ?? false);
      const lines = [
        `${node.varName} = new javax.swing.JCheckBox(${text}, ${selected});`,
      ];
      if (node.layout) {
        lines.push(`${node.varName}.setBounds(${node.layout.x}, ${node.layout.y}, ${node.layout.width}, ${node.layout.height});`);
      }
      return lines.join('\n');
    },
  },
};

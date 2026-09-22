import React, { useRef, useEffect } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import type * as Monaco from 'monaco-editor';
import { FileCode2, Copy, Check } from 'lucide-react';

interface MonacoPanelProps {
  code: string;
  selectedLineRange?: { startLine: number; endLine: number } | null;
  onCopy?: () => void;
}

export const MonacoPanel: React.FC<MonacoPanelProps> = ({
  code,
  selectedLineRange,
  onCopy,
}) => {
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const decorationsRef = useRef<string[]>([]);
  const [copied, setCopied] = React.useState(false);

  const handleEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor;
  };

  // Synchronize line highlight when selectedLineRange changes (Fase 4 feature primed)
  useEffect(() => {
    if (!editorRef.current || !selectedLineRange) {
      if (editorRef.current && decorationsRef.current.length > 0) {
        decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, []);
      }
      return;
    }

    const { startLine, endLine } = selectedLineRange;
    if (startLine > 0 && endLine >= startLine) {
      decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, [
        {
          range: {
            startLineNumber: startLine,
            startColumn: 1,
            endLineNumber: endLine,
            endColumn: 1,
          },
          options: {
            isWholeLine: true,
            className: 'bg-[#094771]/30 border-l-2 border-[#007acc]',
          },
        },
      ]);
      editorRef.current.revealLineInCenterIfOutsideViewport(startLine);
    }
  }, [selectedLineRange]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    if (onCopy) onCopy();
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#1e1e1e]">
      {/* Editor Header Bar */}
      <div className="h-10 bg-[#252526] border-b border-[#3c3c3c] flex items-center justify-between px-3 text-xs text-[#cccccc]">
        <div className="flex items-center gap-2">
          <FileCode2 className="w-4 h-4 text-[#007acc]" />
          <span className="font-semibold text-[#e1e1e1]">GeneratedForm.java</span>
          <span className="px-2 py-0.5 rounded-full bg-[#333333] text-[10px] text-[#858585] uppercase tracking-wider font-medium">
            Java Swing
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Read-Only Notice Badge */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#383838]/80 text-[#aaaaaa] text-[11px] border border-[#444444]">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            <span>Generated — read-only</span>
          </div>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#333333] hover:bg-[#444444] text-[#cccccc] hover:text-white transition-colors text-xs cursor-pointer"
            title="Copy generated code"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Monaco Editor Canvas */}
      <div className="flex-1 w-full h-full relative">
        <Editor
          height="100%"
          language="java"
          theme="vs-dark"
          value={code}
          onMount={handleEditorDidMount}
          options={{
            readOnly: true,
            domReadOnly: true,
            minimap: { enabled: true, maxColumn: 80 },
            scrollBeyondLastLine: false,
            fontSize: 13,
            lineNumbers: 'on',
            renderWhitespace: 'selection',
            automaticLayout: true,
            tabSize: 4,
            wordWrap: 'off',
            cursorStyle: 'line',
          }}
        />
      </div>
    </div>
  );
};

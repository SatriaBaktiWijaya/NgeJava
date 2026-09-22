import React, { useRef, useEffect } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import type * as Monaco from 'monaco-editor';
import { Copy, Check } from 'lucide-react';
import { Button } from './ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';

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
            className: 'bg-zinc-800/80 border-l-2 border-foreground',
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
    <div className="flex flex-col h-full w-full bg-[#101012]">
      {/* Editor Header */}
      <div className="h-10 bg-background border-b border-border flex items-center justify-between px-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-[3px] bg-secondary border border-border">
            <span className="font-mono text-xs text-foreground">GeneratedForm.java</span>
          </div>

          <span className="text-[10px] font-mono text-muted-foreground">
            Java Swing
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Muted Pastel Tag for Read-only State */}
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-[3px] bg-[#291e0a] text-[#fde047] border border-[#523c14]">
            Read-only
          </span>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-6 px-2 text-xs font-normal text-muted-foreground hover:text-foreground hover:bg-secondary rounded-[3px] border border-border"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400 mr-1" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 mr-1" />
                    <span>Copy</span>
                  </>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy Java code</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Editor Surface */}
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
            minimap: { enabled: false }, // Minimalist: no visual clutter
            scrollBeyondLastLine: false,
            fontSize: 12.5,
            fontFamily: "'Geist Mono', 'JetBrains Mono', monospace",
            lineNumbers: 'on',
            lineNumbersMinChars: 3,
            renderWhitespace: 'none',
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

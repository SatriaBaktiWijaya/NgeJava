import React, { useRef, useEffect } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import type * as Monaco from 'monaco-editor';
import { Copy, Check, FileCode2, Lock } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
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
            className: 'monaco-line-highlight',
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
    <div className="flex flex-col h-full w-full bg-[#12121a]">
      {/* Tab Header Bar */}
      <div className="h-11 bg-[#0c0c14] border-b border-white/[0.08] flex items-center justify-between px-3 text-xs">
        <div className="flex items-center gap-2">
          {/* Active File Tab */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-t-lg bg-[#181824] border-t-2 border-indigo-500 border-x border-white/[0.08] text-white shadow-xs">
            <FileCode2 className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-mono text-xs font-medium">GeneratedForm.java</span>
          </div>

          <Badge variant="outline" className="text-[10px] font-mono text-zinc-400 border-white/[0.08] bg-white/[0.02]">
            Java Swing
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {/* Read-Only Status Pill */}
          <Badge variant="outline" className="gap-1 text-[10px] font-mono font-normal px-2 py-0.5 border-amber-500/25 text-amber-400 bg-amber-500/10">
            <Lock className="w-2.5 h-2.5" />
            <span>Read-only</span>
          </Badge>

          {/* Copy Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="h-7 px-2.5 text-xs text-zinc-300 hover:text-white bg-white/[0.03] hover:bg-white/[0.08] border-white/[0.08] rounded-lg transition-all"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400 mr-1.5" />
                    <span className="text-emerald-400 font-medium">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 mr-1.5 text-zinc-400" />
                    <span>Copy</span>
                  </>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy Java source</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Editor Canvas */}
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
            fontFamily: "'Geist Mono', 'JetBrains Mono', monospace",
            lineNumbers: 'on',
            lineNumbersMinChars: 3,
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

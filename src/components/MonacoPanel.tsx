import React, { useRef, useEffect } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import type * as Monaco from 'monaco-editor';
import { FileCode2, Copy, Check, Lock } from 'lucide-react';
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
            className: 'bg-primary/20 border-l-2 border-primary',
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
    <div className="flex flex-col h-full w-full bg-[#18181b]">
      {/* Editor Header Bar */}
      <div className="h-10 bg-background/80 backdrop-blur border-b border-border flex items-center justify-between px-3.5 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-muted/40 border border-border/60">
            <FileCode2 className="w-3.5 h-3.5 text-primary" />
            <span className="font-medium text-foreground text-xs">GeneratedForm.java</span>
          </div>

          <Badge variant="secondary" className="text-[10px] px-2 h-4 font-mono font-normal">
            Swing (JDK 8+)
          </Badge>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Read-Only Notice Badge */}
          <Badge variant="outline" className="gap-1 text-[11px] font-normal px-2 py-0.5 border-border/80 text-muted-foreground bg-muted/20">
            <Lock className="w-3 h-3 text-amber-400" />
            <span>Generated (Read-only)</span>
          </Badge>

          {/* Copy Code Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="gap-1.5 h-7 text-xs border-border/80 hover:bg-accent"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy Code</span>
                  </>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy Java code to clipboard</TooltipContent>
          </Tooltip>
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

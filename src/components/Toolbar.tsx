import React, { useState } from 'react';
import { 
  Coffee, 
  Download, 
  RotateCcw, 
  RotateCw, 
  Trash2,
  FolderOpen,
  Save,
  Keyboard,
  Sparkles
} from 'lucide-react';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';

interface ToolbarProps {
  onExportJava?: () => void;
  onSaveProject?: () => void;
  onLoadProject?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onDelete?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onExportJava,
  onSaveProject,
  onLoadProject,
  onUndo,
  onRedo,
  onDelete,
  canUndo = false,
  canRedo = false,
}) => {
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <>
      <header className="h-12 bg-[#0c0c14]/90 backdrop-blur-md border-b border-white/[0.08] flex items-center justify-between px-4 text-xs select-none shrink-0 z-20">
        {/* Brand & Project Info */}
        <div className="flex items-center gap-3.5">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/25">
              <Coffee className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-tight text-white font-sans">
                  NgeJava
                </span>
                <Badge className="h-4 text-[9px] font-semibold tracking-wide uppercase px-1.5 py-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 border-indigo-500/30 rounded">
                  Studio V1
                </Badge>
              </div>
            </div>
          </div>

          <Separator orientation="vertical" className="h-5 bg-white/[0.08] mx-1" />

          {/* Project File Operations Pill */}
          <div className="flex items-center bg-white/[0.03] border border-white/[0.06] rounded-lg p-0.5 gap-0.5 shadow-inner">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onLoadProject}
                  className="h-7 px-2.5 gap-1.5 text-xs text-zinc-400 hover:text-white hover:bg-white/[0.08] rounded-md transition-colors"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="font-medium">Open</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Open saved JSON project</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onSaveProject}
                  className="h-7 px-2.5 gap-1.5 text-xs text-zinc-400 hover:text-white hover:bg-white/[0.08] rounded-md transition-colors"
                >
                  <Save className="w-3.5 h-3.5 text-purple-400" />
                  <span className="font-medium">Save</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Save project state (JSON)</TooltipContent>
            </Tooltip>
          </div>

          {/* History Pill */}
          <div className="flex items-center bg-white/[0.03] border border-white/[0.06] rounded-lg p-0.5 gap-0.5 shadow-inner">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onUndo}
                  disabled={!canUndo}
                  className="h-7 w-7 text-zinc-400 hover:text-white hover:bg-white/[0.08] rounded-md disabled:opacity-30"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onRedo}
                  disabled={!canRedo}
                  className="h-7 w-7 text-zinc-400 hover:text-white hover:bg-white/[0.08] rounded-md disabled:opacity-30"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Redo (Ctrl+Y)</TooltipContent>
            </Tooltip>

            <Separator orientation="vertical" className="h-4 bg-white/[0.08] my-auto" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onDelete}
                  className="h-7 w-7 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete selected component (Del)</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Right CTA Actions */}
        <div className="flex items-center gap-2.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setHelpOpen(true)}
                className="h-7 px-2.5 gap-1.5 text-xs text-zinc-400 hover:text-white hover:bg-white/[0.08] rounded-lg"
              >
                <Keyboard className="w-3.5 h-3.5" />
                <span>Shortcuts</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Keyboard shortcuts & tips</TooltipContent>
          </Tooltip>

          <Button
            onClick={onExportJava}
            size="sm"
            className="h-7.5 px-3.5 gap-2 text-xs font-semibold bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-lg shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/35 transition-all active:scale-95 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export .java</span>
          </Button>
        </div>
      </header>

      {/* Shortcuts & Help Dialog */}
      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="sm:max-w-[440px] bg-[#12121c] border-white/[0.1] shadow-2xl p-6">
          <DialogHeader className="space-y-1.5">
            <DialogTitle className="flex items-center gap-2 text-base text-white font-sans font-bold">
              <div className="p-1 rounded-md bg-indigo-500/20 text-indigo-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <span>NgeJava Studio Shortcuts</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">
              High-efficiency hotkeys for rapid GUI composition.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-3 text-xs divide-y divide-white/[0.06]">
            <div className="flex items-center justify-between py-2">
              <span className="text-zinc-300">Delete selected component</span>
              <kbd className="px-2 py-1 rounded-md bg-white/[0.06] border border-white/[0.1] text-[11px] font-mono text-zinc-200 shadow-sm">
                Delete / Backspace
              </kbd>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-zinc-300">Undo canvas mutation</span>
              <kbd className="px-2 py-1 rounded-md bg-white/[0.06] border border-white/[0.1] text-[11px] font-mono text-zinc-200 shadow-sm">
                Ctrl + Z
              </kbd>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-zinc-300">Redo canvas mutation</span>
              <kbd className="px-2 py-1 rounded-md bg-white/[0.06] border border-white/[0.1] text-[11px] font-mono text-zinc-200 shadow-sm">
                Ctrl + Y
              </kbd>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-zinc-300">Export generated Java source</span>
              <kbd className="px-2 py-1 rounded-md bg-white/[0.06] border border-white/[0.1] text-[11px] font-mono text-zinc-200 shadow-sm">
                Ctrl + S
              </kbd>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-zinc-300">Instant component creation</span>
              <span className="text-indigo-400 font-medium text-[11px]">Click '+' or double click in Palette</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-zinc-300">Component resizing</span>
              <span className="text-zinc-400 text-[11px]">Drag bottom-right corner handle</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

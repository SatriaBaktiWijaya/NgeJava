import React, { useState } from 'react';
import { 
  Download, 
  RotateCcw, 
  RotateCw, 
  Trash2,
  FolderOpen,
  Save,
  HelpCircle,
} from 'lucide-react';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
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
      <header className="h-10 bg-background border-b border-border flex items-center justify-between px-3 text-xs select-none shrink-0 z-20">
        {/* Brand & File Operations */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-[3px] bg-foreground text-background flex items-center justify-center font-mono font-bold text-[11px]">
              J
            </div>
            <span className="font-semibold text-xs tracking-tight text-foreground">
              NgeJava
            </span>
            <span className="text-[10px] font-mono text-muted-foreground">
              v1.0
            </span>
          </div>

          <Separator orientation="vertical" className="h-3.5 mx-0.5 bg-border/80" />

          {/* Project State Actions */}
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onLoadProject}
                  className="h-6 px-2 gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary font-normal"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>Open</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Open project JSON</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onSaveProject}
                  className="h-6 px-2 gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary font-normal"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Save project state</TooltipContent>
            </Tooltip>
          </div>

          <Separator orientation="vertical" className="h-3.5 mx-0.5 bg-border/80" />

          {/* History Operations */}
          <div className="flex items-center gap-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onUndo}
                  disabled={!canUndo}
                  className="h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-30"
                >
                  <RotateCcw className="w-3 h-3" />
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
                  className="h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-30"
                >
                  <RotateCw className="w-3 h-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Redo (Ctrl+Y)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onDelete}
                  className="h-6 w-6 text-muted-foreground hover:text-rose-400 hover:bg-rose-950/20"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete selected (Del)</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Right CTA Actions */}
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setHelpOpen(true)}
                className="h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-secondary"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Keyboard shortcuts</TooltipContent>
          </Tooltip>

          <Button
            onClick={onExportJava}
            size="sm"
            className="h-6 px-2.5 gap-1.5 text-xs font-medium bg-foreground text-background hover:bg-foreground/90 rounded-[4px] shadow-none cursor-pointer"
          >
            <Download className="w-3 h-3" />
            <span>Export .java</span>
          </Button>
        </div>
      </header>

      {/* Shortcuts & Help Modal */}
      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="sm:max-w-[400px] bg-card border-border p-5">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-sm font-semibold text-foreground">
              Keyboard Navigation
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Minimalist shortcuts for GUI editing.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2 text-xs divide-y divide-border/60">
            <div className="flex items-center justify-between py-1.5">
              <span className="text-muted-foreground">Delete component</span>
              <kbd className="px-1.5 py-0.5 rounded-[3px] bg-secondary border border-border text-[11px] font-mono text-foreground">
                Del
              </kbd>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-muted-foreground">Undo action</span>
              <kbd className="px-1.5 py-0.5 rounded-[3px] bg-secondary border border-border text-[11px] font-mono text-foreground">
                Ctrl + Z
              </kbd>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-muted-foreground">Redo action</span>
              <kbd className="px-1.5 py-0.5 rounded-[3px] bg-secondary border border-border text-[11px] font-mono text-foreground">
                Ctrl + Y
              </kbd>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-muted-foreground">Export Java file</span>
              <kbd className="px-1.5 py-0.5 rounded-[3px] bg-secondary border border-border text-[11px] font-mono text-foreground">
                Ctrl + S
              </kbd>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

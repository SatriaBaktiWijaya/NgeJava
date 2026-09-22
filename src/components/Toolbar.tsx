import React, { useState } from 'react';
import { 
  Coffee, 
  Download, 
  RotateCcw, 
  RotateCw, 
  Trash2,
  FolderOpen,
  Save,
  HelpCircle,
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
      <header className="h-11 bg-background/95 backdrop-blur border-b border-border flex items-center justify-between px-3.5 text-xs select-none shrink-0 z-20">
        {/* Brand & Project Info */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-bold text-xs tracking-tight text-foreground">
            <div className="h-6 w-6 rounded-md bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
              <Coffee className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-sm">NgeJava</span>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-normal text-muted-foreground border-border/80">
              GUI Builder
            </Badge>
          </div>

          <Separator orientation="vertical" className="h-4 mx-1" />

          {/* File Operations */}
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onLoadProject}
                  className="gap-1.5 text-xs h-7 text-muted-foreground hover:text-foreground"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>Open</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Open saved JSON project state</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onSaveProject}
                  className="gap-1.5 text-xs h-7 text-muted-foreground hover:text-foreground"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Save project state (JSON)</TooltipContent>
            </Tooltip>
          </div>

          <Separator orientation="vertical" className="h-4 mx-1" />

          {/* History Operations */}
          <div className="flex items-center gap-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onUndo}
                  disabled={!canUndo}
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
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
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                >
                  <RotateCw className="w-3.5 h-3.5" />
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
                  className="h-7 w-7 text-destructive/80 hover:text-destructive hover:bg-destructive/10 ml-0.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete selected (Del / Backspace)</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setHelpOpen(true)}
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
              >
                <HelpCircle className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Keyboard Shortcuts & Help</TooltipContent>
          </Tooltip>

          <Button
            onClick={onExportJava}
            size="sm"
            className="gap-1.5 h-7 text-xs shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export .java</span>
          </Button>
        </div>
      </header>

      {/* Shortcuts & Help Dialog */}
      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>NgeJava GUI Builder Shortcuts</span>
            </DialogTitle>
            <DialogDescription>
              Keyboard shortcuts and visual tips for fast prototyping.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-border/50">
              <span className="text-muted-foreground">Delete Component</span>
              <kbd className="px-2 py-0.5 rounded bg-muted border border-border text-[11px] font-mono">
                Del / Backspace
              </kbd>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-border/50">
              <span className="text-muted-foreground">Undo Action</span>
              <kbd className="px-2 py-0.5 rounded bg-muted border border-border text-[11px] font-mono">
                Ctrl + Z
              </kbd>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-border/50">
              <span className="text-muted-foreground">Redo Action</span>
              <kbd className="px-2 py-0.5 rounded bg-muted border border-border text-[11px] font-mono">
                Ctrl + Y / Shift + Ctrl + Z
              </kbd>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-border/50">
              <span className="text-muted-foreground">Quick Export .java</span>
              <kbd className="px-2 py-0.5 rounded bg-muted border border-border text-[11px] font-mono">
                Ctrl + S
              </kbd>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-border/50">
              <span className="text-muted-foreground">Instant Add Component</span>
              <span className="text-muted-foreground text-[11px]">Click '+' in Palette</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-muted-foreground">Resize Component</span>
              <span className="text-muted-foreground text-[11px]">Drag bottom-right handle</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

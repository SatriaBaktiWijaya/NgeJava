import React from 'react';
import { 
  Coffee, 
  Download, 
  RotateCcw, 
  RotateCw, 
  Trash2,
  FolderOpen,
  Save
} from 'lucide-react';

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
  return (
    <header className="h-10 bg-[#252526] border-b border-[#3c3c3c] flex items-center justify-between px-3 text-xs select-none shrink-0 z-20">
      {/* Brand & Project Info */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 font-bold text-sm tracking-tight text-white">
          <div className="p-1 rounded bg-[#007acc] text-white">
            <Coffee className="w-4 h-4" />
          </div>
          <span>JForge</span>
          <span className="text-xs font-normal text-[#888888]">(NgeJava)</span>
        </div>

        <div className="h-4 w-[1px] bg-[#3c3c3c]" />

        <div className="flex items-center gap-1">
          <button
            onClick={onLoadProject}
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-[#383838] text-[#cccccc] hover:text-white transition cursor-pointer text-xs"
            title="Open project (JSON)"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Open</span>
          </button>
          <button
            onClick={onSaveProject}
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-[#383838] text-[#cccccc] hover:text-white transition cursor-pointer text-xs"
            title="Save project state"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save</span>
          </button>
        </div>

        <div className="h-4 w-[1px] bg-[#3c3c3c]" />

        {/* Undo/Redo/Delete */}
        <div className="flex items-center gap-1">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1 rounded hover:bg-[#383838] disabled:opacity-30 disabled:hover:bg-transparent text-[#cccccc] transition cursor-pointer"
            title="Undo (Ctrl+Z)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1 rounded hover:bg-[#383838] disabled:opacity-30 disabled:hover:bg-transparent text-[#cccccc] transition cursor-pointer"
            title="Redo (Ctrl+Y)"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="p-1 rounded hover:bg-[#383838] text-rose-400 hover:text-rose-300 transition cursor-pointer ml-1"
            title="Delete selected (Del)"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onExportJava}
          className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#007acc] hover:bg-[#0062a3] text-white font-medium transition cursor-pointer text-xs shadow-sm"
          title="Export as Java source file"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export .java</span>
        </button>
      </div>
    </header>
  );
};

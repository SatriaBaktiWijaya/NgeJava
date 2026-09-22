import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Monitor, Sun, Moon, Sparkles, Box } from 'lucide-react';
import { useBuilderStore } from '../store/useBuilderStore';
import { CanvasNodeView } from './CanvasNodeView';

export const Canvas: React.FC = () => {
  const [previewTheme, setPreviewTheme] = useState<'dark' | 'classic'>('dark');

  const tree = useBuilderStore((s) => s.tree);
  const rootId = useBuilderStore((s) => s.rootId);
  const selectedComponentId = useBuilderStore((s) => s.selectedComponentId);
  const selectComponent = useBuilderStore((s) => s.selectComponent);

  const { setNodeRef, isOver } = useDroppable({
    id: rootId || 'frame-root',
    data: { id: rootId, type: 'JFrame' },
  });

  if (!tree || !rootId) {
    return (
      <div className="flex-1 h-full bg-[#09090e] flex items-center justify-center text-zinc-500 text-xs font-mono">
        No active JFrame
      </div>
    );
  }

  const title = String(tree.props.title || 'GeneratedForm');
  const width = Number(tree.props.width || 520);
  const height = Number(tree.props.height || 380);
  const isRootSelected = selectedComponentId === rootId;

  const handleFrameClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectComponent(rootId);
  };

  return (
    <div className="flex-1 h-full bg-[#09090e] flex flex-col min-w-0 overflow-hidden relative select-none">
      {/* Canvas Top Bar */}
      <div className="h-11 px-3.5 border-b border-white/[0.08] flex items-center justify-between text-xs shrink-0 bg-[#0c0c14] gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center gap-2">
            <Box className="w-4 h-4 text-indigo-400 shrink-0" />
            <span className="font-semibold text-white tracking-tight truncate">Form Designer</span>
          </div>
          <span className="text-[10px] font-mono text-zinc-400 border border-white/[0.08] bg-white/[0.02] px-2 py-0.5 rounded hidden md:inline-block">
            null layout
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Theme Switcher for Form Preview (Solves the blinding cream clash) */}
          <div className="flex items-center bg-white/[0.04] border border-white/[0.08] rounded-lg p-0.5 gap-0.5">
            <button
              onClick={() => setPreviewTheme('dark')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium transition-all ${
                previewTheme === 'dark'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Modern Dark Swing Preview"
            >
              <Moon className="w-3 h-3" />
              <span>Dark</span>
            </button>
            <button
              onClick={() => setPreviewTheme('classic')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium transition-all ${
                previewTheme === 'classic'
                  ? 'bg-zinc-700 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Classic Swing (Nimbus / OS default)"
            >
              <Sun className="w-3 h-3" />
              <span>Classic</span>
            </button>
          </div>

          <div className="flex items-center gap-1 text-[10px] font-mono text-zinc-300 bg-white/[0.05] border border-white/[0.08] px-2 py-1 rounded-md">
            <Monitor className="w-3 h-3 text-indigo-400" />
            <span>{width}×{height}</span>
          </div>
        </div>
      </div>

      {/* Canvas Studio Workbench */}
      <div
        className="flex-1 overflow-auto p-10 relative flex items-center justify-center bg-[#09090e]"
        onClick={() => selectComponent(null)}
        style={{
          backgroundImage: `
            radial-gradient(circle at center, rgba(99, 102, 241, 0.07) 0%, transparent 65%),
            radial-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 20px 20px',
        }}
      >
        {/* Modern Window Chrome Frame */}
        <div
          onClick={handleFrameClick}
          style={{ width: `${width}px`, height: `${height}px` }}
          className={`rounded-xl border flex flex-col relative transition-all duration-200 overflow-hidden shadow-2xl ${
            isRootSelected
              ? 'border-indigo-500 ring-2 ring-indigo-500/40 shadow-indigo-500/10'
              : 'border-white/[0.14] hover:border-white/[0.25]'
          }`}
        >
          {/* Window Top Bar */}
          <div className="h-8 bg-[#181824] border-b border-white/[0.08] px-3.5 flex items-center justify-between text-xs text-foreground shrink-0 cursor-default">
            {/* macOS Window Action Dots */}
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56] border border-[#e0443e] shadow-xs" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e] border border-[#dea123] shadow-xs" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f] border border-[#1aab29] shadow-xs" />
            </div>

            <div className="flex items-center gap-1.5 font-medium text-xs text-zinc-200 truncate max-w-[260px]">
              <span>{title}</span>
            </div>

            <div className="w-10" />
          </div>

          {/* Droppable Swing Content Canvas Area */}
          <div
            ref={setNodeRef}
            className={`flex-1 relative overflow-hidden transition-colors ${
              previewTheme === 'dark'
                ? 'bg-[#151520] text-zinc-100'
                : 'bg-[#ece9d8] text-zinc-900'
            } ${isOver ? 'ring-2 ring-inset ring-indigo-500/60' : ''}`}
          >
            {tree.children.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-zinc-500 pointer-events-none select-none">
                <div className="p-3 rounded-full bg-indigo-500/10 text-indigo-400 mb-2">
                  <Sparkles className="w-6 h-6" />
                </div>
                <p className="font-semibold text-zinc-300 text-xs">Ready for Swing Components</p>
                <p className="text-[11px] text-zinc-500 mt-1 max-w-xs leading-relaxed">
                  Drag controls from the left palette or click '+' to start composing.
                </p>
              </div>
            )}

            {/* Render children nodes */}
            {tree.children.map((child) => (
              <CanvasNodeView key={child.id} node={child} isDarkPreview={previewTheme === 'dark'} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

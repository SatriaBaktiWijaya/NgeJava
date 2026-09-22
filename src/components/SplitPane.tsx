import React, { useState, useCallback, useEffect, useRef } from 'react';

interface SplitPaneProps {
  left: React.ReactNode;
  right: React.ReactNode;
  defaultRatio?: number; // 0.0 to 1.0 (left portion)
  minLeftWidth?: number;
  minRightWidth?: number;
  onRatioChange?: (ratio: number) => void;
}

export const SplitPane: React.FC<SplitPaneProps> = ({
  left,
  right,
  defaultRatio = 0.55,
  minLeftWidth = 600,
  minRightWidth = 350,
  onRatioChange,
}) => {
  const [ratio, setRatio] = useState<number>(defaultRatio);
  const isDraggingRef = useRef<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const containerWidth = rect.width;
      const mouseX = e.clientX - rect.left;

      // Clamp between minLeftWidth and containerWidth - minRightWidth
      const clampedX = Math.max(minLeftWidth, Math.min(containerWidth - minRightWidth, mouseX));
      const newRatio = clampedX / containerWidth;

      setRatio(newRatio);
      if (onRatioChange) {
        onRatioChange(newRatio);
      }
    };

    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [minLeftWidth, minRightWidth, onRatioChange]);

  return (
    <div ref={containerRef} className="flex flex-1 w-full h-full overflow-hidden relative">
      {/* Left panel (Builder: Palette + Canvas + Inspector) */}
      <div
        style={{ width: `${ratio * 100}%` }}
        className="h-full flex overflow-hidden relative border-r border-[#333333]"
      >
        {left}
      </div>

      {/* Resizable Divider */}
      <div
        onMouseDown={handleMouseDown}
        className="w-1.5 hover:w-2 bg-[#2d2d2d] hover:bg-[#007acc] transition-all cursor-col-resize flex items-center justify-center z-30 group select-none"
        title="Drag to resize panels"
      >
        <div className="h-8 w-0.5 bg-[#555555] group-hover:bg-white rounded" />
      </div>

      {/* Right panel (Monaco Code Editor) */}
      <div
        style={{ width: `${(1 - ratio) * 100}%` }}
        className="h-full flex overflow-hidden relative"
      >
        {right}
      </div>
    </div>
  );
};

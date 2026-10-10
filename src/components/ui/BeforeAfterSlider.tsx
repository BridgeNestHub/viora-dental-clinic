import React, { useState, useRef, useCallback } from 'react';

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  title?: string;
  doctorName?: string;
  className?: string;
}

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({
  beforeImage,
  afterImage,
  title,
  doctorName,
  className = '',
}) => {
  const [sliderPosition, setSliderPosition] = useState<number>(50); // percentage 0 - 100
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback(
    (clientX: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const percentage = Math.min(Math.max((x / rect.width) * 100, 0), 100);
      setSliderPosition(percentage);
    },
    []
  );

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  return (
    <div className={`relative flex flex-col rounded-2xl overflow-hidden bg-slate-900 border border-slate-200/80 shadow-sm ${className}`}>
      <div
        ref={containerRef}
        className="relative w-full aspect-[4/3] select-none overflow-hidden cursor-ew-resize group"
        onMouseDown={() => setIsDragging(true)}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
      >
        {/* After Image (Background) */}
        <img
          src={afterImage}
          alt={`${title || 'Treatment'} After`}
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />

        {/* Before Image (Clipped Overlay) */}
        <div
          className="absolute inset-0 overflow-hidden pointer-events-none"
          style={{ width: `${sliderPosition}%` }}
        >
          <img
            src={beforeImage}
            alt={`${title || 'Treatment'} Before`}
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover max-w-none"
            style={{ width: containerRef.current ? `${containerRef.current.clientWidth}px` : '100%' }}
          />
        </div>

        {/* Subtle Labels */}
        <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-sm text-white text-[11px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-md border border-white/10 pointer-events-none">
          Before
        </div>
        <div className="absolute top-3 right-3 bg-sky-600/90 backdrop-blur-sm text-white text-[11px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-md border border-sky-400/20 pointer-events-none">
          After Result
        </div>

        {/* Divider Line & Handle */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg pointer-events-none transition-transform"
          style={{ left: `${sliderPosition}%` }}
        >
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-slate-900 shadow-md flex items-center justify-center border border-slate-200 ring-2 ring-sky-500/20">
            <svg
              className="w-4 h-4 text-sky-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M8 9l-3 3 3 3m8-6l3 3-3 3"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Card Info footer */}
      {(title || doctorName) && (
        <div className="p-3.5 bg-white border-t border-slate-100 flex items-center justify-between">
          <div>
            {title && <h4 className="text-sm font-semibold text-slate-900 leading-snug">{title}</h4>}
            {doctorName && <p className="text-xs text-slate-500 mt-0.5">Treated by {doctorName}</p>}
          </div>
          <div className="text-[11px] text-sky-700 bg-sky-50 px-2 py-0.5 rounded font-medium">
            Drag to compare
          </div>
        </div>
      )}
    </div>
  );
};

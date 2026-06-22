import React from 'react';

/**
 * CutoutCard — Reusable octagonal clip-path card.
 * Used across the profile and listing pages.
 */
export default function CutoutCard({
  children,
  className = '',
  innerClassName = '',
  cutoutSize = 24,
  showDecorations = false,
  onClick,
}) {
  const clip = `polygon(
    ${cutoutSize}px 0%,
    calc(100% - ${cutoutSize}px) 0%,
    100% ${cutoutSize}px,
    100% calc(100% - ${cutoutSize}px),
    calc(100% - ${cutoutSize}px) 100%,
    ${cutoutSize}px 100%,
    0% calc(100% - ${cutoutSize}px),
    0% ${cutoutSize}px
  )`;

  return (
    <div
      onClick={onClick}
      className={`relative ${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={{ clipPath: clip, padding: '1.5px', background: 'rgba(200,200,205,0.55)', boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}
    >
      {showDecorations && (
        <>
          <div className="absolute top-2 left-6 h-1.5 w-1.5 rounded-full bg-slate-400/40 z-20 pointer-events-none" />
          <div className="absolute top-6 left-2 h-1.5 w-1.5 rounded-full bg-slate-400/40 z-20 pointer-events-none" />
          <div className="absolute top-2 right-6 h-1.5 w-1.5 rounded-full bg-slate-400/40 z-20 pointer-events-none" />
          <div className="absolute top-6 right-2 h-1.5 w-1.5 rounded-full bg-slate-400/40 z-20 pointer-events-none" />
          <div className="absolute bottom-2 left-6 h-1.5 w-1.5 rounded-full bg-slate-400/40 z-20 pointer-events-none" />
          <div className="absolute bottom-6 left-2 h-1.5 w-1.5 rounded-full bg-slate-400/40 z-20 pointer-events-none" />
          <div className="absolute bottom-2 right-6 h-1.5 w-1.5 rounded-full bg-slate-400/40 z-20 pointer-events-none" />
          <div className="absolute bottom-6 right-2 h-1.5 w-1.5 rounded-full bg-slate-400/40 z-20 pointer-events-none" />
        </>
      )}
      <div
        className={`w-full h-full bg-white/85 backdrop-blur-xl ${innerClassName}`}
        style={{ clipPath: clip }}
      >
        {children}
      </div>
    </div>
  );
}

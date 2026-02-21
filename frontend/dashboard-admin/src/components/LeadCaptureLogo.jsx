import React from 'react';

const LeadCaptureIcon = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 60 60"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ filter: 'drop-shadow(0 0 8px #22c55e)' }}
    aria-label="LeadCapture Pro"
  >
    {/* linha superior */}
    <line x1="3" y1="12" x2="36" y2="12" stroke="#22c55e" strokeWidth="3.5" strokeLinecap="round"/>
    {/* linha curva central superior */}
    <path d="M3 30 L27 30 L42 12 L57 12" stroke="#22c55e" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
    {/* linha curva central inferior */}
    <path d="M3 30 L27 30 L42 48 L57 48" stroke="#22c55e" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
    {/* linha inferior */}
    <line x1="3" y1="48" x2="36" y2="48" stroke="#22c55e" strokeWidth="3.5" strokeLinecap="round"/>
  </svg>
);

export default function LeadCaptureLogo({ variant = 'icon', size = 48 }) {
  if (variant === 'full') {
    const iconSize = Math.round(size * 0.55);
    const fontSize = Math.round(size * 0.18);
    const proSize = Math.round(size * 0.14);
    return (
      <div className="flex flex-col items-center gap-2" aria-label="LeadCapture Pro">
        <LeadCaptureIcon size={iconSize} />
        <div style={{ lineHeight: 1 }}>
          <span
            style={{ fontSize, fontWeight: 300, color: '#ffffff', letterSpacing: '0.05em' }}
          >
            LeadCapture
          </span>
          <span
            style={{ fontSize: proSize, fontWeight: 900, color: '#22c55e', letterSpacing: '0.2em', marginLeft: '0.3em' }}
          >
            PRO
          </span>
        </div>
      </div>
    );
  }

  return <LeadCaptureIcon size={size} />;
}

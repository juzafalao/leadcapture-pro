export default function LogoIcon({ size = 48, className = '' }) {
  return (
    <svg
      height={size}
      viewBox="0 0 280 90"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'block' }}
      aria-label="LeadCapture Pro"
    >
      <defs>
        <filter id="lcpro-neon" x="-40%" y="-100%" width="180%" height="300%">
          <feGaussianBlur stdDeviation="4" result="blur1" />
          <feGaussianBlur stdDeviation="8" result="blur2" in="SourceGraphic" />
          <feMerge>
            <feMergeNode in="blur2" />
            <feMergeNode in="blur1" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="lcpro-spark" x="-150%" y="-150%" width="400%" height="400%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── UPPER SPEED LINE ── */}
      {/* ghost trails */}
      <path d="M 5,62 C 75,30 165,28 250,37" stroke="#00FF88" strokeWidth="1"   strokeLinecap="round" opacity="0.12" />
      <path d="M 5,66 C 75,34 165,32 250,41" stroke="#00FF88" strokeWidth="1.8" strokeLinecap="round" opacity="0.22" />
      <path d="M 5,70 C 75,38 165,36 250,45" stroke="#00FF88" strokeWidth="2.5" strokeLinecap="round" opacity="0.40" />
      {/* bright main line */}
      <path d="M 5,74 C 75,42 165,40 250,49" stroke="#00FF88" strokeWidth="3.5" strokeLinecap="round" filter="url(#lcpro-neon)" />

      {/* ── LOWER SPEED LINE ── */}
      {/* ghost trails */}
      <path d="M 28,75 C 95,55 168,54 250,58" stroke="#00FF88" strokeWidth="1"   strokeLinecap="round" opacity="0.12" />
      <path d="M 28,79 C 95,59 168,58 250,62" stroke="#00FF88" strokeWidth="1.8" strokeLinecap="round" opacity="0.22" />
      <path d="M 28,83 C 95,63 168,62 250,66" stroke="#00FF88" strokeWidth="2.5" strokeLinecap="round" opacity="0.40" />
      {/* bright main line */}
      <path d="M 28,87 C 95,67 168,66 250,70" stroke="#00FF88" strokeWidth="3.5" strokeLinecap="round" filter="url(#lcpro-neon)" />

      {/* ── PARTICLES – upper tip ── */}
      <circle cx="253" cy="47" r="2.5" fill="#00FF88" filter="url(#lcpro-spark)" opacity="0.95" />
      <circle cx="261" cy="42" r="1.5" fill="#00FF88" opacity="0.65" />
      <circle cx="267" cy="50" r="1"   fill="#00FF88" opacity="0.45" />
      <circle cx="258" cy="54" r="1"   fill="#00FF88" opacity="0.30" />

      {/* ── PARTICLES – lower tip ── */}
      <circle cx="253" cy="68" r="2.5" fill="#00FF88" filter="url(#lcpro-spark)" opacity="0.95" />
      <circle cx="261" cy="63" r="1.5" fill="#00FF88" opacity="0.65" />
      <circle cx="267" cy="71" r="1"   fill="#00FF88" opacity="0.45" />
      <circle cx="258" cy="75" r="1"   fill="#00FF88" opacity="0.30" />
    </svg>
  );
}

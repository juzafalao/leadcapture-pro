import logoIcon from '../assets/logo-login.jpg';

/**
 * Renders the application's logo as an image element.
 *
 * Renders an <img> with the bundled logo asset and alt text "LeadCapture Pro"; the image width is controlled by `size`.
 *git p
 * @param {Object} props - Component props.
 * @param {number} [props.size=48] - Width of the logo in pixels.
 * @param {string} [props.className=''] - Additional CSS classes applied to the <img> element.
 * @returns {JSX.Element} The logo image element.
 */
export default function LogoIcon({ size = 48, className = '' }) {
  return (
    <div 
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <div 
        className="absolute inset-0 rounded-xl"
        style={{
          background: 'linear-gradient(135deg, #10B981 0%, #059669 50%, #047857 100%)',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
        }}
      />
      <svg viewBox="0 0 24 24" fill="none" style={{ width: size * 0.6, height: size * 0.6, position: 'relative', zIndex: 1 }}>
        <path d="M3 17L9 11L13 15L21 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M17 7H21V11" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="21" cy="7" r="2" fill="#FCD34D"/>
      </svg>
      {size >= 48 && (
        <div className="absolute -bottom-1 -right-1 bg-[#0F172A] border-2 border-[#10B981] rounded-md px-1 flex items-center justify-center"
          style={{ fontSize: Math.max(6, size * 0.12) }}>
          <span className="text-[#10B981] font-black tracking-wider">PRO</span>
        </div>
      )}
    </div>
  )
}

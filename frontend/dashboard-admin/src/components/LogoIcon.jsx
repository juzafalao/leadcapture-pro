import logoIcon from '../assets/logo-login.jpg';

/**
 * Renders the application's logo as an image element.
 *
 * Renders an <img> with the bundled logo asset and alt text "LeadCapture Pro"; the image width is controlled by `size`.
 *
 * @param {Object} props - Component props.
 * @param {number} [props.size=48] - Width of the logo in pixels.
 * @param {string} [props.className=''] - Additional CSS classes applied to the <img> element.
 * @returns {JSX.Element} The logo image element.
 */
export default function LogoIcon({ size = 48, className = '' }) {
  return (
    <img
      src={logoIcon}
      alt="LeadCapture Pro"
      width={size}
      className={className}
      style={{
        objectFit: 'contain',
        display: 'block',
        height: 'auto',
        imageRendering: 'auto',
        borderRadius: '12px',
        mixBlendMode: 'lighten',
      }}
    />
  );
}

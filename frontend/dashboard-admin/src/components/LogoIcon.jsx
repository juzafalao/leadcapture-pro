import logoImg from '../logo.png';

export default function LogoIcon({ size = 48, className = '' }) {
  return (
    <img
      src={logoImg}
      alt="LeadCapture Pro"
      width={size}
      height={size}
      className={className}
      style={{ objectFit: 'contain', display: 'block' }}
    />
  );
}

import logoImg from '../assets/logo-leadcapture.png';

export default function LogoIcon({ size = 48, className = '' }) {
  return (
    <img
      src={logoIcon}
      alt="LeadCapture Pro"
      width={size}
      className={className}
      style={{ objectFit: 'contain', display: 'block', height: 'auto' }}
    />
  );
}

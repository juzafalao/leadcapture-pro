import logoImg from '../assets/logo-leadcapture.png';

export default function LogoIcon({ size = 48, className = '' }) {
  return (
    <img
      src={logoImg}
      alt="LeadCapture Pro"
      height={size}
      className={className}
      style={{ objectFit: 'contain', display: 'block' }}
    />
  );
}

import logoIcon from '../assets/logo-login.jpg';

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

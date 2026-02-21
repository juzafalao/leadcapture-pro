export default function LogoIcon({ size = 48, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Fundo circular escuro */}
      <circle cx="50" cy="50" r="48" fill="#0a0f0a" stroke="#22c55e" strokeWidth="2"/>
      <circle cx="50" cy="50" r="44" fill="transparent" stroke="#16a34a" strokeWidth="0.5" opacity="0.5"/>

      {/* Asa superior */}
      <path
        d="M15 38 C25 34, 40 33, 55 36 C65 38, 75 42, 82 40 C75 44, 65 45, 55 43 C40 40, 25 41, 15 38Z"
        fill="#4ade80"
        opacity="0.9"
      />
      {/* Asa do meio */}
      <path
        d="M12 50 C22 46, 38 45, 55 48 C67 50, 78 54, 86 51 C78 56, 67 57, 55 55 C38 52, 22 53, 12 50Z"
        fill="#22c55e"
      />
      {/* Asa inferior / curva */}
      <path
        d="M18 62 C30 58, 45 60, 58 63 C50 70, 38 72, 25 68 C20 66, 17 64, 18 62Z"
        fill="#16a34a"
        opacity="0.8"
      />
      {/* Linha de brilho */}
      <path
        d="M20 75 C40 72, 60 73, 78 71"
        stroke="#4ade80"
        strokeWidth="1.5"
        opacity="0.6"
        strokeLinecap="round"
      />
      {/* Brilho central */}
      <ellipse cx="55" cy="50" rx="8" ry="3" fill="white" opacity="0.15"/>
    </svg>
  );
}

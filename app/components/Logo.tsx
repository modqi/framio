export function LomissaLogo({ width = 160, className = '' }: { width?: number, className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 160 80"
      width={width}
      className={className}
      role="img"
      aria-label="Lomissa"
    >
      <g transform="translate(90, 22)">
        <line x1="0"    y1="-5"   x2="0"    y2="-11"  stroke="#C1622F" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="-3.5" y1="-3.5" x2="-7.5" y2="-7.5" stroke="#C1622F" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="-5"   y1="0"    x2="-11"  y2="0"    stroke="#C1622F" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="3.5"  y1="-3.5" x2="7.5"  y2="-7.5" stroke="#C1622F" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="5"    y1="0"    x2="11"   y2="0"    stroke="#C1622F" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="0" cy="0" r="3.5" fill="#C1622F"/>
      </g>
      <text
        x="80"
        y="62"
        textAnchor="middle"
        fontFamily="'Cormorant Garamond', Georgia, serif"
        fontSize="32"
        fontWeight="400"
        letterSpacing="-0.3"
        fill="#2B1D12"
      >
        lomissa
      </text>
    </svg>
  );
}

export function LomissaLogoWhite({ width = 160, className = '' }: { width?: number, className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 160 80"
      width={width}
      className={className}
      role="img"
      aria-label="Lomissa"
    >
      <g transform="translate(90, 22)">
        <line x1="0"    y1="-5"   x2="0"    y2="-11"  stroke="#C1622F" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="-3.5" y1="-3.5" x2="-7.5" y2="-7.5" stroke="#C1622F" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="-5"   y1="0"    x2="-11"  y2="0"    stroke="#C1622F" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="3.5"  y1="-3.5" x2="7.5"  y2="-7.5" stroke="#C1622F" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="5"    y1="0"    x2="11"   y2="0"    stroke="#C1622F" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="0" cy="0" r="3.5" fill="#C1622F"/>
      </g>
      <text
        x="80"
        y="62"
        textAnchor="middle"
        fontFamily="'Cormorant Garamond', Georgia, serif"
        fontSize="32"
        fontWeight="400"
        letterSpacing="-0.3"
        fill="#FAF7F1"
      >
        lomissa
      </text>
    </svg>
  );
}
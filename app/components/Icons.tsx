// Lomissa brand icons — 64×64 grid, 1.6px stroke, rounded caps, terracotta
// For icons on terracotta backgrounds, pass color="#FDFBF8"

type IconProps = { size?: number; color?: string };
const T = "#C8622A";

export const CameraIcon = ({ size = 24, color = T }: IconProps) => (
  <svg viewBox="0 0 64 64" width={size} height={size} fill="none" aria-hidden="true">
    <g stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M 8 22 L 8 50 Q 8 54 12 54 L 52 54 Q 56 54 56 50 L 56 22 Q 56 18 52 18 L 44 18 L 40 12 L 24 12 L 20 18 L 12 18 Q 8 18 8 22 Z"/>
      <circle cx="32" cy="36" r="6" fill={color} stroke="none"/>
      <line x1="32" y1="26" x2="32" y2="22"/>
      <line x1="40" y1="28" x2="43" y2="25"/>
      <line x1="24" y1="28" x2="21" y2="25"/>
      <line x1="42" y1="36" x2="46" y2="36"/>
      <line x1="22" y1="36" x2="18" y2="36"/>
    </g>
  </svg>
);

export const CalendarIcon = ({ size = 24, color = T }: IconProps) => (
  <svg viewBox="0 0 64 64" width={size} height={size} fill="none" aria-hidden="true">
    <g stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="10" y="14" width="44" height="40" rx="4"/>
      <line x1="10" y1="24" x2="54" y2="24"/>
      <line x1="20" y1="10" x2="20" y2="18"/>
      <line x1="44" y1="10" x2="44" y2="18"/>
      <g transform="translate(32, 40)">
        <circle r="3.5" fill={color} stroke="none"/>
        <line y1="-7" y2="-10"/>
        <line x1="6" x2="9"/>
        <line x1="-6" x2="-9"/>
        <line x1="4.3" y1="-4.9" x2="6.3" y2="-7.2"/>
        <line x1="-4.3" y1="-4.9" x2="-6.3" y2="-7.2"/>
      </g>
    </g>
  </svg>
);

export const MessageIcon = ({ size = 24, color = T }: IconProps) => (
  <svg viewBox="0 0 64 64" width={size} height={size} fill="none" aria-hidden="true">
    <g stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M 10 16 Q 10 12 14 12 L 50 12 Q 54 12 54 16 L 54 40 Q 54 44 50 44 L 28 44 L 18 54 L 18 44 L 14 44 Q 10 44 10 40 Z"/>
      <g transform="translate(32, 28)">
        <circle r="3" fill={color} stroke="none"/>
        <line y1="-6" y2="-9"/>
        <line x1="5.2" y1="-3" x2="7.8" y2="-4.5"/>
        <line x1="-5.2" y1="-3" x2="-7.8" y2="-4.5"/>
      </g>
      <circle cx="22" cy="28" r="1" fill={color} stroke="none"/>
      <circle cx="42" cy="28" r="1" fill={color} stroke="none"/>
    </g>
  </svg>
);

export const ProfileIcon = ({ size = 24, color = T }: IconProps) => (
  <svg viewBox="0 0 64 64" width={size} height={size} fill="none" aria-hidden="true">
    <g stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="32" cy="22" r="10"/>
      <g transform="translate(32, 22)">
        <circle r="3" fill={color} stroke="none"/>
        <line y1="-5.5" y2="-8"/>
        <line x1="3.9" y1="-3.9" x2="5.7" y2="-5.7"/>
        <line x1="-3.9" y1="-3.9" x2="-5.7" y2="-5.7"/>
      </g>
      <path d="M 10 54 Q 10 40 32 40 Q 54 40 54 54"/>
    </g>
  </svg>
);

export const PortfolioIcon = ({ size = 24, color = T }: IconProps) => (
  <svg viewBox="0 0 64 64" width={size} height={size} fill="none" aria-hidden="true">
    <g stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="8" y="14" width="48" height="36" rx="4"/>
      <polyline points="8,38 20,26 30,34 42,22 56,34"/>
      <g transform="translate(48, 22)">
        <circle r="3" fill={color} stroke="none"/>
        <line y1="-5" y2="-8"/>
        <line x1="3.5" y1="-3.5" x2="5" y2="-5"/>
        <line x1="-3.5" y1="-3.5" x2="-5" y2="-5"/>
      </g>
    </g>
  </svg>
);

export const PackageIcon = ({ size = 24, color = T }: IconProps) => (
  <svg viewBox="0 0 64 64" width={size} height={size} fill="none" aria-hidden="true">
    <g stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M 8 20 L 32 10 L 56 20 L 56 44 L 32 54 L 8 44 Z"/>
      <line x1="8" y1="20" x2="32" y2="30"/>
      <line x1="56" y1="20" x2="32" y2="30"/>
      <line x1="32" y1="30" x2="32" y2="54"/>
      <g transform="translate(32, 20)">
        <circle r="2.5" fill={color} stroke="none"/>
        <line y1="-4" y2="-7"/>
        <line x1="3.5" y1="-2.5" x2="5" y2="-5"/>
        <line x1="-3.5" y1="-2.5" x2="-5" y2="-5"/>
      </g>
    </g>
  </svg>
);

export const EmptyInboxIcon = ({ size = 56, color = T }: IconProps) => (
  <svg viewBox="0 0 64 64" width={size} height={size} fill="none" aria-hidden="true">
    <g stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M 8 28 L 8 50 Q 8 54 12 54 L 52 54 Q 56 54 56 50 L 56 28 L 32 40 Z"/>
      <path d="M 8 28 L 32 18 L 56 28"/>
      <g transform="translate(32, 10)">
        <circle r="3.5" fill={color} stroke="none"/>
        <line y1="-6" y2="-10"/>
        <line x1="4.3" y1="-3" x2="7.5" y2="-5.2"/>
        <line x1="-4.3" y1="-3" x2="-7.5" y2="-5.2"/>
        <line x1="6" y1="0" x2="9" y2="0"/>
        <line x1="-6" y1="0" x2="-9" y2="0"/>
      </g>
    </g>
  </svg>
);

export const ReviewStarIcon = ({ size = 56, color = T }: IconProps) => (
  <svg viewBox="0 0 64 64" width={size} height={size} fill="none" aria-hidden="true">
    <g stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="32" cy="32" r="9" fill={color} stroke="none"/>
      <line x1="32" y1="18" x2="32" y2="10" strokeWidth="2"/>
      <line x1="32" y1="46" x2="32" y2="54" strokeWidth="2"/>
      <line x1="46" y1="32" x2="54" y2="32" strokeWidth="2"/>
      <line x1="18" y1="32" x2="10" y2="32" strokeWidth="2"/>
      <line x1="42" y1="22" x2="48" y2="16" strokeWidth="2"/>
      <line x1="22" y1="22" x2="16" y2="16" strokeWidth="2"/>
      <line x1="42" y1="42" x2="48" y2="48" strokeWidth="2"/>
      <line x1="22" y1="42" x2="16" y2="48" strokeWidth="2"/>
    </g>
  </svg>
);

export const CheckIcon = ({ size = 14, color = "currentColor" }: IconProps) => (
  <svg viewBox="0 0 14 14" width={size} height={size} fill="none" aria-hidden="true">
    <polyline points="1,7 5,11 13,3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const XIcon = ({ size = 14, color = "currentColor" }: IconProps) => (
  <svg viewBox="0 0 14 14" width={size} height={size} fill="none" aria-hidden="true">
    <line x1="1" y1="1" x2="13" y2="13" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <line x1="13" y1="1" x2="1" y2="13" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const ImageFileIcon = ({ size = 20, color = T }: IconProps) => (
  <svg viewBox="0 0 64 64" width={size} height={size} fill="none" aria-hidden="true">
    <g stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="8" y="8" width="48" height="48" rx="4"/>
      <polyline points="8,42 22,28 32,36 42,24 56,36"/>
      <g transform="translate(48, 20)">
        <circle r="3" fill={color} stroke="none"/>
        <line y1="-5" y2="-8"/>
        <line x1="3.5" y1="-3.5" x2="5" y2="-5"/>
        <line x1="-3.5" y1="-3.5" x2="-5" y2="-5"/>
      </g>
    </g>
  </svg>
);

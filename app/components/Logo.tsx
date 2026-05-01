import Link from 'next/link'

type LogoSize = 'sm' | 'md' | 'lg' | 'xl'

interface LogoProps {
  size?:   LogoSize
  asLink?: boolean
  href?:   string
}

const SIZES: Record<LogoSize, { fontSize: string; sunW: number; sunH: number; gap: number }> = {
  sm: { fontSize: '1.25rem',  sunW: 14, sunH: 12, gap: 2 },
  md: { fontSize: '1.875rem', sunW: 20, sunH: 17, gap: 3 },
  lg: { fontSize: '2.5rem',   sunW: 26, sunH: 22, gap: 4 },
  xl: { fontSize: '3.5rem',   sunW: 36, sunH: 30, gap: 5 },
}

function SunMark({ sunW, sunH, gap }: { sunW: number; sunH: number; gap: number }) {
  const C = '#C1622F'
  const SW = 1.5

  return (
    <svg
      width={sunW}
      height={sunH}
      viewBox="0 0 20 18"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{
        position:      'absolute',
        bottom:        `calc(100% + ${gap}px)`,
        left:          '50%',
        transform:     'translateX(-50%)',
        overflow:      'visible',
        pointerEvents: 'none',
        display:       'block',
      }}
    >
      <line x1="5.8"  y1="13"   x2="1"    y2="13"  stroke={C} strokeWidth={SW} strokeLinecap="round" />
      <line x1="7.0"  y1="10.0" x2="3.6"  y2="6.6" stroke={C} strokeWidth={SW} strokeLinecap="round" />
      <line x1="10"   y1="8.8"  x2="10"   y2="4"   stroke={C} strokeWidth={SW} strokeLinecap="round" />
      <line x1="13.0" y1="10.0" x2="16.4" y2="6.6" stroke={C} strokeWidth={SW} strokeLinecap="round" />
      <line x1="14.2" y1="13"   x2="19"   y2="13"  stroke={C} strokeWidth={SW} strokeLinecap="round" />
      <circle cx="10" cy="13" r="3" fill={C} />
    </svg>
  )
}

function Wordmark({ size }: { size: LogoSize }) {
  const { fontSize, sunW, sunH, gap } = SIZES[size]

  return (
    <span
      aria-label="lomissa"
      style={{
        display:       'inline-flex',
        alignItems:    'baseline',
        fontFamily:    "'Cormorant Garamond', Georgia, serif",
        fontSize,
        fontWeight:    400,
        fontStyle:     'normal',
        color:         '#2B1D12',
        letterSpacing: '-0.015em',
        lineHeight:    1,
        userSelect:    'none',
      }}
    >
      <span aria-hidden="true">lom</span>
      <span
        aria-hidden="true"
        style={{
          position:      'relative',
          display:       'inline-block',
          verticalAlign: 'baseline',
        }}
      >
        <SunMark sunW={sunW} sunH={sunH} gap={gap} />
        i
      </span>
      <span aria-hidden="true">ssa</span>
    </span>
  )
}

export default function Logo({ size = 'md', asLink = true, href = '/' }: LogoProps) {
  const mark = <Wordmark size={size} />

  if (!asLink) {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center' }}>
        {mark}
      </div>
    )
  }

  return (
    <Link
      href={href}
      aria-label="Lomissa — go to homepage"
      style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}
    >
      {mark}
    </Link>
  )
}

export function LomissaLogo({ width = 160, className = '' }: { width?: number, className?: string }) {
  return <Logo size="md" asLink={false} />
}

export function LomissaLogoWhite({ width = 160, className = '' }: { width?: number, className?: string }) {
  return (
    <span style={{filter: 'brightness(10)'}}>
      <Logo size="md" asLink={false} />
    </span>
  )
}
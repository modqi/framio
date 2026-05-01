import Link from 'next/link'

type LogoSize = 'sm' | 'md' | 'lg' | 'xl'

interface LogoProps {
  size?:   LogoSize
  asLink?: boolean
  href?:   string
}

const SIZES: Record<LogoSize, { fontSize: string; sunW: number; sunH: number; gap: number }> = {
  sm: { fontSize: '1.375rem', sunW: 22, sunH: 18, gap: 6  },
  md: { fontSize: '2rem',     sunW: 32, sunH: 26, gap: 10 },
  lg: { fontSize: '2.75rem',  sunW: 44, sunH: 36, gap: 14 },
  xl: { fontSize: '3.75rem',  sunW: 58, sunH: 48, gap: 18 },
}

function SunMark({ sunW, sunH, gap }: { sunW: number; sunH: number; gap: number }) {
  const C  = '#C1622F'
  const SW = 1.8

  const ray = (angleDeg: number): [number, number, number, number] => {
    const rad = (angleDeg * Math.PI) / 180
    const innerR = 6.5
    const outerR = 14
    const x1 = 20 + innerR * Math.cos(rad)
    const y1 = 20 - innerR * Math.sin(rad)
    const x2 = 20 + outerR * Math.cos(rad)
    const y2 = 20 - outerR * Math.sin(rad)
    return [x1, y1, x2, y2]
  }

  const rays = [165, 135, 110, 90, 70, 45, 15]

  return (
    <svg
      width={sunW}
      height={sunH}
      viewBox="0 0 40 32"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ display: 'block', marginBottom: gap }}
    >
      {rays.map((angle) => {
        const [x1, y1, x2, y2] = ray(angle)
        return (
          <line
            key={angle}
            x1={x1} y1={y1}
            x2={x2} y2={y2}
            stroke={C}
            strokeWidth={SW}
            strokeLinecap="round"
          />
        )
      })}
      <circle cx="20" cy="20" r="4" fill={C} />
    </svg>
  )
}

function LogoMark({ size }: { size: LogoSize }) {
  const { fontSize, sunW, sunH, gap } = SIZES[size]

  return (
    <span
      style={{
        display:        'inline-flex',
        flexDirection:  'column',
        alignItems:     'center',
        textDecoration: 'none',
      }}
    >
      <SunMark sunW={sunW} sunH={sunH} gap={gap} />
      <span
        style={{
          fontFamily:    "var(--font-cormorant), 'Cormorant Garamond', Georgia, serif",
          fontSize,
          fontWeight:    500,
          fontStyle:     'normal',
          color:         '#2B1D12',
          letterSpacing: '-0.02em',
          lineHeight:    1,
          userSelect:    'none',
        }}
      >
        lomissa
      </span>
    </span>
  )
}

export default function Logo({ size = 'md', asLink = true, href = '/' }: LogoProps) {
  if (!asLink) {
    return <LogoMark size={size} />
  }

  return (
    <Link
      href={href}
      aria-label="Lomissa — go to homepage"
      style={{ display: 'inline-flex', textDecoration: 'none' }}
    >
      <LogoMark size={size} />
    </Link>
  )
}

export function LomissaLogo({ width = 160, className = '' }: { width?: number, className?: string }) {
  return <Logo size="md" asLink={false} />
}

export function LomissaLogoWhite({ width = 160, className = '' }: { width?: number, className?: string }) {
  return <Logo size="md" asLink={false} />
}
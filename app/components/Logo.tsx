import Link from 'next/link'

type LogoSize = 'sm' | 'md' | 'lg' | 'xl'

interface LogoProps {
  size?:   LogoSize
  asLink?: boolean
  href?:   string
}

const SIZES: Record<LogoSize, { textSize: number; sunScale: number; gap: number }> = {
  sm: { textSize: 22, sunScale: 0.55, gap: 4 },
  md: { textSize: 32, sunScale: 0.80, gap: 6 },
  lg: { textSize: 44, sunScale: 1.10, gap: 8 },
  xl: { textSize: 60, sunScale: 1.50, gap: 12 },
}

function SunMark({ scale }: { scale: number }) {
  const C = '#C1622F'
  const SW = 1.8

  const ray = (angleDeg: number) => {
    const rad = (angleDeg * Math.PI) / 180
    const ir = 6.5
    const or = 14
    return {
      x1: 20 + ir * Math.cos(rad),
      y1: 20 - ir * Math.sin(rad),
      x2: 20 + or * Math.cos(rad),
      y2: 20 - or * Math.sin(rad),
    }
  }

  const rays = [165, 135, 110, 90, 70, 45, 15]
  const w = 40 * scale
  const h = 32 * scale

  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 40 32"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ display: 'block' }}
    >
      {rays.map((angle) => {
        const r = ray(angle)
        return (
          <line
            key={angle}
            x1={r.x1} y1={r.y1}
            x2={r.x2} y2={r.y2}
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
  const { textSize, sunScale, gap } = SIZES[size]

  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
      <SunMark scale={sunScale} />
      <span style={{ display: 'block', height: gap }} />
      <span
        style={{
          fontFamily:    "'Cormorant Garamond', Georgia, serif",
          fontSize:      textSize,
          fontWeight:    500,
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
  if (!asLink) return <LogoMark size={size} />
  return (
    <Link href={href} aria-label="Lomissa" style={{ display: 'inline-flex', textDecoration: 'none' }}>
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
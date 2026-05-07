"use client";
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

type LogoSize = 'sm' | 'md' | 'lg' | 'xl'

interface LogoProps {
  size?:   LogoSize
  asLink?: boolean
  href?:   string
  color?:  string
  accent?: string
}

const SCALE: Record<LogoSize, number> = {
  sm: 0.6,
  md: 0.9,
  lg: 1.2,
  xl: 1.6,
}

function LogoSVG({ color = '#3a2418', accent = '#c45a2c', scale = 1 }: { color?: string; accent?: string; scale?: number }) {
  const size = 56 * scale

  return (
    <svg
      viewBox="0 0 320 100"
      height={size}
      style={{ display: 'block', overflow: 'visible' }}
      aria-hidden="true"
    >
      {/* Sunburst above the 'i' */}
      <g transform="translate(174, 30)">
        <circle cx="0" cy="0" r="5" fill={accent} />
        {[-60, -30, 0, 30, 60].map((deg) => {
          const rad = (deg * Math.PI) / 180
          return (
            <line
              key={deg}
              x1={Math.sin(rad) * 9}  y1={-Math.cos(rad) * 9}
              x2={Math.sin(rad) * 14} y2={-Math.cos(rad) * 14}
              stroke={accent}
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          )
        })}
      </g>

      {/* Wordmark */}
      <text
        x="160"
        y="78"
        textAnchor="middle"
        fill={color}
        style={{
          fontFamily: '"Cormorant Garamond", Georgia, serif',
          fontSize: 64,
          fontWeight: 400,
          fontStyle: 'italic',
          letterSpacing: '-0.025em',
        }}
      >
        lomissa
      </text>
    </svg>
  )
}

function LogoMark({ size, color, accent }: { size: LogoSize; color?: string; accent?: string }) {
  const scale = SCALE[size]
  return <LogoSVG color={color} accent={accent} scale={scale} />
}

export default function Logo({ size = 'md', asLink = true, href, color, accent }: LogoProps) {
  const [resolvedHref, setResolvedHref] = useState(href ?? '/')

  useEffect(() => {
    if (!asLink || href) return
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      const role = user.user_metadata?.role
      setResolvedHref(role === 'photographer' ? '/photographer-dashboard' : '/dashboard')
    })
  }, [asLink, href])

  if (!asLink) return <LogoMark size={size} color={color} accent={accent} />
  return (
    <Link href={resolvedHref} aria-label="Lomissa" style={{ display: 'inline-flex', textDecoration: 'none' }}>
      <LogoMark size={size} color={color} accent={accent} />
    </Link>
  )
}

export function LomissaLogo({ width = 160, className = '' }: { width?: number, className?: string }) {
  return <Logo size="md" asLink={false} />
}

export function LomissaLogoWhite({ width = 160, className = '' }: { width?: number, className?: string }) {
  return <Logo size="md" asLink={false} color="#FAF7F1" accent="#C1622F" />
}
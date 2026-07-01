import type { CSSProperties } from 'react'
import type { Profile } from './types'

export function prettyName(email: string): string {
  const local = String(email).split('@')[0].replace(/[._-]+/g, ' ').trim()
  return (
    local
      .split(' ')
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ') || 'Você'
  )
}

export function initials(name: string): string {
  return (
    String(name)
      .split(' ')
      .filter(Boolean)
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'US'
  )
}

export function avatarStyle(
  user: Pick<Profile, 'color'>,
  size = 26,
  idx = 0,
): CSSProperties {
  const s = size
  return {
    width: s + 'px',
    height: s + 'px',
    borderRadius: '50%',
    background: user.color || 'var(--primary)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--font-primary)',
    fontWeight: 700,
    fontSize: s * 0.4 + 'px',
    border: '2px solid var(--surface-alt)',
    flex: 'none',
    marginLeft: idx ? '-8px' : '0',
    boxSizing: 'border-box',
  }
}

export function formatDate(iso: string): string {
  try {
    return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

export function readingTime(content: string): string {
  const w = String(content).trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(w / 200)) + ' min de leitura'
}

export function matches(text: string, q: string): number {
  if (!q) return 0
  let n = 0
  let i = 0
  const t = String(text).toLowerCase()
  while ((i = t.indexOf(q, i)) !== -1) {
    n++
    i += q.length
  }
  return n
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

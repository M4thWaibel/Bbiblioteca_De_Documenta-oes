import type { CSSProperties } from 'react'

// ===== Estilos de hover reutilizados (portados do design) =====
export const ghostHover: CSSProperties = { borderColor: 'var(--primary)', color: 'var(--primary)' }
export const dangerHover: CSSProperties = { borderColor: 'rgba(220,53,69,0.6)', color: '#F87171' }
export const dashedHover: CSSProperties = {
  borderColor: 'rgba(229,72,77,0.5)',
  color: 'var(--text-secondary)',
}
export const uploadBtnHover: CSSProperties = {
  transform: 'translateY(-2px)',
  boxShadow: '0 8px 22px rgba(229,72,77,0.42)',
}

// ===== Chips e botões de navegação =====
export function chipStyle(active: boolean): CSSProperties {
  const base: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 11px',
    borderRadius: '999px',
    fontFamily: 'var(--font-primary)',
    fontWeight: 600,
    fontSize: '11.5px',
    cursor: 'pointer',
    border: '1px solid',
    transition: 'border-color 200ms var(--ease-standard), color 200ms, background 200ms',
    whiteSpace: 'nowrap',
  }
  if (active)
    return {
      ...base,
      background: 'var(--primary-subtle)',
      color: 'var(--primary)',
      borderColor: 'rgba(229,72,77,0.5)',
    }
  return { ...base, background: 'var(--surface)', color: 'var(--text-secondary)', borderColor: 'var(--border-light)' }
}

export function subChipStyle(active: boolean): CSSProperties {
  const base: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '7px',
    padding: '6px 10px',
    borderRadius: '9px',
    fontFamily: 'var(--font-primary)',
    fontWeight: 600,
    fontSize: '11.5px',
    cursor: 'pointer',
    border: '1px solid',
    transition: 'border-color 200ms var(--ease-standard), color 200ms, background 200ms',
    whiteSpace: 'nowrap',
  }
  if (active)
    return {
      ...base,
      background: 'var(--primary-subtle)',
      color: 'var(--primary)',
      borderColor: 'rgba(229,72,77,0.5)',
    }
  return { ...base, background: 'var(--surface)', color: 'var(--text-secondary)', borderColor: 'var(--border-light)' }
}

export function navBtnStyle(active: boolean): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '7px',
    height: '40px',
    padding: '0 14px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontFamily: 'var(--font-primary)',
    fontWeight: 600,
    fontSize: '12.5px',
    border: '1px solid ' + (active ? 'rgba(229,72,77,0.5)' : 'var(--border-light)'),
    background: active ? 'var(--primary-subtle)' : 'transparent',
    color: active ? 'var(--primary)' : 'var(--text-secondary)',
  }
}

export function badgeStyle(active: boolean): CSSProperties {
  return {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: '10px',
    fontWeight: 600,
    background: active ? 'rgba(229,72,77,0.18)' : 'var(--surface-light)',
    color: active ? 'var(--primary)' : 'var(--text-muted)',
    borderRadius: '6px',
    padding: '1px 6px',
  }
}

// ===== Botão primário (gradiente) reutilizável =====
export function primaryBtnStyle(disabled: boolean): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    height: '42px',
    padding: '0 18px',
    borderRadius: '9px',
    border: 'none',
    fontFamily: 'var(--font-primary)',
    fontWeight: 700,
    fontSize: '13px',
    letterSpacing: '0.03em',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    background: 'var(--gradient-primary)',
    color: '#fff',
    boxShadow: disabled ? 'none' : '0 4px 14px rgba(229,72,77,0.3)',
  }
}

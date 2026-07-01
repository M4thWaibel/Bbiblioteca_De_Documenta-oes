import type { CSSProperties, ReactNode } from 'react'
import { Icon } from '../ui/Icon'

export const modalLabel: CSSProperties = {
  fontFamily: 'var(--font-primary)',
  fontWeight: 500,
  fontSize: '12px',
  color: 'var(--text-secondary)',
}

export const modalInput: CSSProperties = {
  height: '42px',
  padding: '0 12px',
  borderRadius: '8px',
  background: 'var(--surface)',
  border: '1px solid var(--border-light)',
  color: 'var(--text)',
  fontFamily: 'var(--font-secondary)',
  fontSize: '13.5px',
  outline: 'none',
}

export const modalTextarea: CSSProperties = {
  padding: '10px 12px',
  borderRadius: '8px',
  background: 'var(--surface)',
  border: '1px solid var(--border-light)',
  color: 'var(--text)',
  fontFamily: 'var(--font-secondary)',
  fontSize: '13.5px',
  outline: 'none',
  resize: 'vertical',
  lineHeight: 1.5,
}

export const modalSelect: CSSProperties = {
  ...modalInput,
  cursor: 'pointer',
  padding: '0 10px',
}

export const cancelBtn: CSSProperties = {
  height: '42px',
  padding: '0 18px',
  borderRadius: '9px',
  background: 'transparent',
  border: '1px solid var(--border-light)',
  color: 'var(--text-secondary)',
  fontFamily: 'var(--font-primary)',
  fontWeight: 600,
  fontSize: '13px',
  cursor: 'pointer',
}

export function ModalShell({
  onClose,
  width,
  children,
}: {
  onClose: () => void
  width: number
  children: ReactNode
}) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: '24px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: `min(${width}px,100%)`,
          maxHeight: '92vh',
          overflow: 'auto',
          background: 'var(--surface-elevated)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '24px 26px 22px',
          boxShadow: '0 30px 70px rgba(0,0,0,0.6)',
        }}
      >
        {children}
      </div>
    </div>
  )
}

export function ModalCloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      onClick={onClose}
      style={{
        width: '34px',
        height: '34px',
        borderRadius: '8px',
        background: 'transparent',
        border: '1px solid var(--border-light)',
        color: 'var(--text-secondary)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 'none',
      }}
    >
      <Icon name="close" size={18} />
    </button>
  )
}

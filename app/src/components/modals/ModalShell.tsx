import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react'
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

const FOCUSABLE =
  'button, [href], input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])'

export function ModalShell({
  onClose,
  width,
  children,
}: {
  onClose: () => void
  width: number
  children: ReactNode
}) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const restoreTo = document.activeElement as HTMLElement | null
    const panel = panelRef.current
    const visible = () =>
      Array.from(panel?.querySelectorAll<HTMLElement>(FOCUSABLE) || []).filter(
        (el) => el.offsetParent !== null,
      )
    // move o foco para dentro do diálogo
    panel?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      } else if (e.key === 'Tab') {
        const items = visible()
        if (!items.length) return
        const first = items[0]
        const last = items[items.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      restoreTo?.focus?.()
    }
  }, [onClose])

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
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
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
          outline: 'none',
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
      type="button"
      aria-label="Fechar"
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

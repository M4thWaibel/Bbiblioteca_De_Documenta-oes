import { useState } from 'react'
import type { Store } from '../../store/useStore'
import { Icon } from '../ui/Icon'
import { Hoverable } from '../ui/Hoverable'
import { dangerHover, primaryBtnStyle, uploadBtnHover } from '../ui/styles'
import { ModalShell, ModalCloseButton, modalInput, modalLabel } from './ModalShell'

export function StatusesModal({ store }: { store: Store }) {
  const statuses = store.statuses
  const [nLabel, setNLabel] = useState('')
  const [nColor, setNColor] = useState('#a0a0a0')

  const add = () => {
    if (!nLabel.trim()) return
    store.createStatus(nLabel, nColor)
    setNLabel('')
    setNColor('#a0a0a0')
  }

  const colorInput = {
    width: '34px',
    height: '34px',
    borderRadius: '8px',
    border: '1px solid var(--border-light)',
    padding: 0,
    background: 'transparent',
    cursor: 'pointer',
    flex: 'none' as const,
  }

  return (
    <ModalShell onClose={store.closeStatuses} width={520}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '18px' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-primary)', fontWeight: 600, fontSize: '18px', color: 'var(--text)' }}>
            Status do quadro
          </div>
          <div style={{ fontFamily: 'var(--font-secondary)', fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '3px' }}>
            Globais — são as colunas do quadro. <strong style={{ color: 'var(--primary)' }}>A fazer</strong> e{' '}
            <strong style={{ color: 'var(--primary)' }}>Concluído</strong> são fixos. Excluir um status move as
            tarefas dele para <strong>A fazer</strong>.
          </div>
        </div>
        <ModalCloseButton onClose={store.closeStatuses} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
        {statuses.map((s) => {
          const fixed = s.id === 'todo' || s.id === 'done'
          return (
            <div
              key={`${s.id}:${s.color}:${s.label}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 10px',
                borderRadius: '10px',
                background: 'var(--surface)',
                border: '1px solid var(--border-light)',
              }}
            >
              <span style={{ width: '11px', height: '11px', borderRadius: '3px', background: s.color, flex: 'none' }} />
              <input
                type="color"
                value={s.color}
                onChange={(e) => store.updateStatus(s.id, { label: s.label, color: e.target.value })}
                title="Cor"
                aria-label="Cor do status"
                style={colorInput}
              />
              <input
                defaultValue={s.label}
                onBlur={(e) =>
                  e.target.value.trim() &&
                  e.target.value !== s.label &&
                  store.updateStatus(s.id, { label: e.target.value, color: s.color })
                }
                aria-label="Nome do status"
                style={{ ...modalInput, flex: 1, height: '34px' }}
              />
              {fixed ? (
                <span
                  style={{
                    fontFamily: 'var(--font-secondary)',
                    fontSize: '10.5px',
                    color: 'var(--text-muted)',
                    width: '30px',
                    textAlign: 'center',
                    flex: 'none',
                  }}
                  title="Status âncora (não pode ser excluído)"
                >
                  fixo
                </span>
              ) : (
                <Hoverable
                  as="button"
                  onClick={() => store.deleteStatus(s.id)}
                  title="Excluir status"
                  aria-label="Excluir status"
                  hoverStyle={dangerHover}
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '8px',
                    background: 'transparent',
                    border: '1px solid var(--border-light)',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flex: 'none',
                  }}
                >
                  <Icon name="delete" size={15} />
                </Hoverable>
              )}
            </div>
          )
        })}
      </div>

      <label style={modalLabel}>Novo status</label>
      <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
        <input
          type="color"
          value={nColor}
          onChange={(e) => setNColor(e.target.value)}
          title="Cor"
          aria-label="Cor do novo status"
          style={colorInput}
        />
        <input
          value={nLabel}
          onChange={(e) => setNLabel(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              add()
            }
          }}
          placeholder="Nome do status"
          style={{ ...modalInput, flex: 1, height: '38px' }}
        />
        <Hoverable
          as="button"
          onClick={add}
          disabled={!nLabel.trim()}
          hoverStyle={nLabel.trim() ? uploadBtnHover : undefined}
          style={primaryBtnStyle(!nLabel.trim())}
        >
          <Icon name="add" size={18} />
          Adicionar
        </Hoverable>
      </div>
    </ModalShell>
  )
}

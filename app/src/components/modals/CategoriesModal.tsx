import { useState } from 'react'
import type { Store } from '../../store/useStore'
import { Icon } from '../ui/Icon'
import { Hoverable } from '../ui/Hoverable'
import { dangerHover, primaryBtnStyle, uploadBtnHover } from '../ui/styles'
import { catChip } from '../../lib/constants'
import { ModalShell, ModalCloseButton, modalInput, modalLabel } from './ModalShell'

export function CategoriesModal({ store }: { store: Store }) {
  const cats = store.categories
  const [nLabel, setNLabel] = useState('')
  const [nIcon, setNIcon] = useState('label')
  const [nColor, setNColor] = useState('#e5484d')

  const add = () => {
    if (!nLabel.trim()) return
    store.createCategory(nLabel, nIcon, nColor)
    setNLabel('')
    setNIcon('label')
    setNColor('#e5484d')
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
    <ModalShell onClose={store.closeCategories} width={560}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '18px' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-primary)', fontWeight: 600, fontSize: '18px', color: 'var(--text)' }}>
            Categorias
          </div>
          <div style={{ fontFamily: 'var(--font-secondary)', fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '3px' }}>
            Globais — valem para todos os projetos. Excluir uma categoria faz os documentos dela
            aparecerem como <strong style={{ color: 'var(--primary)' }}>Geral</strong>.
          </div>
        </div>
        <ModalCloseButton onClose={store.closeCategories} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
        {cats.map((c) => {
          const cc = catChip(c.color)
          return (
            <div
              key={`${c.id}:${c.color}:${c.icon}:${c.label}`}
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
              <span
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: cc.bg,
                  color: cc.fg,
                  flex: 'none',
                }}
              >
                <Icon name={c.icon} size={17} />
              </span>
              <input
                type="color"
                value={c.color}
                onChange={(e) => store.updateCategory(c.id, { label: c.label, icon: c.icon, color: e.target.value })}
                title="Cor"
                aria-label="Cor da categoria"
                style={colorInput}
              />
              <input
                defaultValue={c.icon}
                onBlur={(e) =>
                  e.target.value.trim() &&
                  e.target.value !== c.icon &&
                  store.updateCategory(c.id, { label: c.label, icon: e.target.value.trim(), color: c.color })
                }
                title="Ícone (Material Symbols)"
                aria-label="Ícone"
                style={{ ...modalInput, width: '120px', height: '34px', flex: 'none' }}
              />
              <input
                defaultValue={c.label}
                onBlur={(e) =>
                  e.target.value.trim() &&
                  e.target.value !== c.label &&
                  store.updateCategory(c.id, { label: e.target.value, icon: c.icon, color: c.color })
                }
                aria-label="Nome da categoria"
                style={{ ...modalInput, flex: 1, height: '34px' }}
              />
              {c.id === 'geral' ? (
                <span
                  style={{
                    fontFamily: 'var(--font-secondary)',
                    fontSize: '10.5px',
                    color: 'var(--text-muted)',
                    width: '30px',
                    textAlign: 'center',
                    flex: 'none',
                  }}
                  title="Categoria padrão (não pode ser excluída)"
                >
                  fixa
                </span>
              ) : (
                <Hoverable
                  as="button"
                  onClick={() => store.deleteCategory(c.id)}
                  title="Excluir categoria"
                  aria-label="Excluir categoria"
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

      <label style={modalLabel}>Nova categoria</label>
      <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
        <input
          type="color"
          value={nColor}
          onChange={(e) => setNColor(e.target.value)}
          title="Cor"
          aria-label="Cor da nova categoria"
          style={colorInput}
        />
        <input
          value={nIcon}
          onChange={(e) => setNIcon(e.target.value)}
          placeholder="ícone"
          title="Ícone (Material Symbols, ex.: folder)"
          style={{ ...modalInput, width: '120px', height: '38px', flex: 'none' }}
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
          placeholder="Nome da categoria"
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

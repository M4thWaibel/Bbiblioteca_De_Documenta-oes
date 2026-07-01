import type { Store } from '../../store/useStore'
import { Icon } from '../ui/Icon'
import { Hoverable } from '../ui/Hoverable'
import { primaryBtnStyle, uploadBtnHover } from '../ui/styles'
import { projColors } from '../../lib/constants'
import {
  ModalShell,
  ModalCloseButton,
  cancelBtn,
  modalInput,
  modalLabel,
  modalTextarea,
} from './ModalShell'

export function ProjectModal({ store }: { store: Store }) {
  const f = store.projForm
  const parent = f.parentId ? store.project(f.parentId) : null
  const disabled = !f.name.trim()

  return (
    <ModalShell onClose={store.closeProjModal} width={480}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '18px' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-primary)', fontWeight: 600, fontSize: '18px', color: 'var(--text)' }}>
            {parent ? 'Novo subprojeto' : 'Novo projeto'}
          </div>
          <div style={{ fontFamily: 'var(--font-secondary)', fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '3px' }}>
            {parent
              ? `Dentro de ${parent.name} · agrupa documentações específicas.`
              : 'Agrupe documentações e subprojetos relacionados.'}
          </div>
        </div>
        <ModalCloseButton onClose={store.closeProjModal} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '12px' }}>
        <label style={modalLabel}>Nome do projeto</label>
        <input
          value={f.name}
          onChange={(e) => store.patchProjForm('name')(e.target.value)}
          placeholder="Ex.: Cliente X · App Mobile"
          style={modalInput}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '14px' }}>
        <label style={modalLabel}>Descrição</label>
        <textarea
          value={f.description}
          onChange={(e) => store.patchProjForm('description')(e.target.value)}
          placeholder="Do que se trata este projeto"
          rows={2}
          style={modalTextarea}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
        <label style={modalLabel}>Cor</label>
        <div style={{ display: 'flex', gap: '10px' }}>
          {projColors.map((hex) => (
            <button
              key={hex}
              onClick={() => store.setProjColor(hex)}
              title="Cor"
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '9px',
                background: hex,
                border: 'none',
                cursor: 'pointer',
                boxShadow:
                  f.color === hex
                    ? '0 0 0 2px var(--surface-elevated), 0 0 0 4px ' + hex
                    : 'none',
                transition: 'box-shadow 150ms',
              }}
            />
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
        <button onClick={store.closeProjModal} style={cancelBtn}>
          Cancelar
        </button>
        <Hoverable
          as="button"
          onClick={store.saveProject}
          disabled={disabled}
          hoverStyle={disabled ? undefined : uploadBtnHover}
          style={primaryBtnStyle(disabled)}
        >
          <Icon name={parent ? 'account_tree' : 'create_new_folder'} size={18} />
          {parent ? 'Criar subprojeto' : 'Criar projeto'}
        </Hoverable>
      </div>
    </ModalShell>
  )
}

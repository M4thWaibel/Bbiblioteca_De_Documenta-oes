import { useMemo, type CSSProperties } from 'react'
import type { Store } from '../../store/useStore'
import { Icon } from '../ui/Icon'
import { Hoverable } from '../ui/Hoverable'
import { primaryBtnStyle, uploadBtnHover } from '../ui/styles'
import { cats } from '../../lib/constants'
import { mdToHtml } from '../../lib/markdown'
import {
  ModalShell,
  ModalCloseButton,
  cancelBtn,
  modalInput,
  modalLabel,
  modalSelect,
  modalTextarea,
} from './ModalShell'

export function UploadModal({ store }: { store: Store }) {
  const f = store.form
  const isEditing = !!store.editingDocId
  const curProj = store.project(store.currentProjectId)
  const subsList = store.currentProjectId ? store.subprojects(store.currentProjectId) : []
  const hasFile = !!f.content
  const disabled = !(f.title.trim() && f.content.trim())
  // #2: pré-visualização ao vivo do Markdown (memoizada por conteúdo).
  const preview = useMemo(() => mdToHtml(f.content).html, [f.content])

  const dropStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    minHeight: '110px',
    padding: '18px',
    marginBottom: '16px',
    borderRadius: '12px',
    cursor: 'pointer',
    border: '1.5px dashed ' + (hasFile ? 'rgba(229,72,77,0.5)' : 'var(--border-light)'),
    background: hasFile ? 'var(--primary-subtle)' : 'var(--surface)',
  }

  return (
    <ModalShell onClose={store.closeUpload} width={920}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '18px' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-primary)', fontWeight: 600, fontSize: '18px', color: 'var(--text)' }}>
            {isEditing ? 'Editar documentação' : 'Subir documentação'}
          </div>
          <div style={{ fontFamily: 'var(--font-secondary)', fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '3px' }}>
            {isEditing ? (
              'Ajuste os campos e o conteúdo em Markdown.'
            ) : (
              <>
                Salvando em <strong style={{ color: 'var(--primary)' }}>{curProj?.name}</strong> · envie
                um .md ou escreva do zero, com pré-visualização ao vivo.
              </>
            )}
          </div>
        </div>
        <ModalCloseButton onClose={store.closeUpload} />
      </div>

      <label
        onDrop={(e) => {
          e.preventDefault()
          store.readFile(e.dataTransfer?.files?.[0])
        }}
        onDragOver={(e) => e.preventDefault()}
        style={dropStyle}
      >
        <input
          type="file"
          accept=".md,.markdown,text/markdown"
          onChange={(e) => store.readFile(e.target.files?.[0])}
          style={{ display: 'none' }}
        />
        {hasFile ? (
          <>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', fontFamily: 'var(--font-secondary)', fontSize: '13px', color: 'var(--text)' }}>
              <Icon name="description" size={24} style={{ color: 'var(--primary)' }} />
              {f.fileName || 'Conteúdo carregado'}
            </span>
            <span style={{ fontFamily: 'var(--font-secondary)', fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '6px' }}>
              Clique para trocar o arquivo
            </span>
          </>
        ) : (
          <>
            <Icon name="upload_file" size={34} style={{ color: 'var(--primary)' }} />
            <span style={{ fontFamily: 'var(--font-primary)', fontWeight: 600, fontSize: '13.5px', color: 'var(--text-secondary)', marginTop: '8px' }}>
              Arraste um .md aqui ou clique para selecionar
            </span>
            <span style={{ fontFamily: 'var(--font-secondary)', fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '3px' }}>
              O conteúdo será renderizado e indexado para busca
            </span>
          </>
        )}
      </label>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '12px' }}>
        <label style={modalLabel}>Título</label>
        <input
          value={f.title}
          onChange={(e) => store.patchForm('title')(e.target.value)}
          placeholder="Ex.: Guia de Onboarding do Consultor"
          style={modalInput}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '12px' }}>
        <label style={modalLabel}>Descrição / resumo curto</label>
        <textarea
          value={f.description}
          onChange={(e) => store.patchForm('description')(e.target.value)}
          placeholder="Uma linha explicando do que trata este documento"
          rows={2}
          style={modalTextarea}
        />
      </div>

      {!isEditing && subsList.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '12px' }}>
          <label style={modalLabel}>Subprojeto</label>
          <select value={f.subId} onChange={(e) => store.patchForm('subId')(e.target.value)} style={modalSelect}>
            <option value="">Raiz do projeto</option>
            {subsList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={modalLabel}>Categoria / módulo</label>
          <select value={f.category} onChange={(e) => store.patchForm('category')(e.target.value)} style={modalSelect}>
            {cats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={modalLabel}>Tags (separadas por vírgula)</label>
          <input
            value={f.tagsText}
            onChange={(e) => store.patchForm('tagsText')(e.target.value)}
            placeholder="processo, checklist"
            style={modalInput}
          />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
          <label style={modalLabel}>Conteúdo (Markdown)</label>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              fontFamily: 'var(--font-secondary)',
              fontSize: '11px',
              color: 'var(--text-muted)',
            }}
          >
            <Icon name="visibility" size={14} />
            Pré-visualização ao vivo
          </span>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <textarea
            value={f.content}
            onChange={(e) => store.patchForm('content')(e.target.value)}
            placeholder={'# Título\n\nEscreva ou cole o conteúdo em Markdown…'}
            style={{ ...modalTextarea, flex: '1 1 320px', minWidth: '260px', minHeight: '360px' }}
          />
          <div
            className="md-body"
            style={{
              flex: '1 1 320px',
              minWidth: '260px',
              minHeight: '360px',
              maxHeight: '360px',
              overflowY: 'auto',
              padding: '14px 18px',
              borderRadius: '8px',
              background: 'var(--surface)',
              border: '1px solid var(--border-light)',
            }}
          >
            {f.content.trim() ? (
              <div dangerouslySetInnerHTML={{ __html: preview }} />
            ) : (
              <span style={{ fontFamily: 'var(--font-secondary)', fontSize: '12.5px', color: 'var(--text-muted)' }}>
                A pré-visualização aparece aqui conforme você escreve.
              </span>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
        <button onClick={store.closeUpload} style={cancelBtn}>
          Cancelar
        </button>
        <Hoverable
          as="button"
          onClick={store.saveUpload}
          disabled={disabled}
          hoverStyle={disabled ? undefined : uploadBtnHover}
          style={primaryBtnStyle(disabled)}
        >
          <Icon name={isEditing ? 'save' : 'library_add'} size={18} />
          {isEditing ? 'Salvar alterações' : 'Salvar na biblioteca'}
        </Hoverable>
      </div>
    </ModalShell>
  )
}

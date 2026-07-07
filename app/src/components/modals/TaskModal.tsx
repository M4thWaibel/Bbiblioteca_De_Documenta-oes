import type { CSSProperties } from 'react'
import type { Store } from '../../store/useStore'
import type { Priority, TaskStatus } from '../../lib/types'
import { Icon } from '../ui/Icon'
import { Hoverable } from '../ui/Hoverable'
import { dangerHover, primaryBtnStyle, uploadBtnHover } from '../ui/styles'
import { columnsMeta, priorityOptions } from '../../lib/constants'
import { avatarStyle, initials } from '../../lib/format'
import {
  ModalShell,
  ModalCloseButton,
  cancelBtn,
  modalInput,
  modalLabel,
  modalSelect,
  modalTextarea,
} from './ModalShell'

const refSelect: CSSProperties = {
  flex: 1,
  height: '40px',
  padding: '0 10px',
  borderRadius: '8px',
  background: 'var(--surface)',
  border: '1px solid var(--border-light)',
  color: 'var(--text-secondary)',
  fontFamily: 'var(--font-secondary)',
  fontSize: '12.5px',
  outline: 'none',
  cursor: 'pointer',
}

export function TaskModal({ store }: { store: Store }) {
  const f = store.taskForm
  const isEditing = !!store.editingTaskId
  const disabled = !f.title.trim()

  const projLabel = (p: import('../../lib/types').Project) =>
    p.parentId ? `${store.project(p.parentId)?.name || ''} › ${p.name}` : p.name

  const mineProjects = store.projects.filter((p) => p.members.includes(store.me))
  const mineIds = mineProjects.map((p) => p.id)
  const projRefOptions = mineProjects
    .slice()
    .sort((a, b) => {
      const ta = store.topProjectId(a.id)
      const tb = store.topProjectId(b.id)
      if (ta !== tb) return ta.localeCompare(tb)
      return (a.parentId ? 1 : 0) - (b.parentId ? 1 : 0)
    })
    .map((p) => ({ id: p.id, label: projLabel(p) }))
  const docRefOptions = store.docs
    .filter((d) => mineIds.includes(d.projectId))
    .map((d) => {
      const p = store.project(d.projectId)
      return { id: d.id, label: (p ? projLabel(p) : '') + ' · ' + d.title }
    })

  return (
    <ModalShell onClose={store.closeTask} width={580}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '18px' }}>
        <div style={{ fontFamily: 'var(--font-primary)', fontWeight: 600, fontSize: '18px', color: 'var(--text)' }}>
          {isEditing ? 'Editar tarefa' : 'Nova tarefa'}
        </div>
        <ModalCloseButton onClose={store.closeTask} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '12px' }}>
        <label style={modalLabel}>Título</label>
        <input
          value={f.title}
          onChange={(e) => store.patchTaskForm('title')(e.target.value)}
          placeholder="Ex.: Revisar guia da RMR"
          style={modalInput}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '12px' }}>
        <label style={modalLabel}>Descrição</label>
        <textarea
          value={f.description}
          onChange={(e) => store.patchTaskForm('description')(e.target.value)}
          placeholder="Detalhes da tarefa"
          rows={2}
          style={modalTextarea}
        />
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={modalLabel}>Coluna</label>
          <select
            value={f.status}
            onChange={(e) => store.patchTaskForm('status')(e.target.value as TaskStatus)}
            style={modalSelect}
          >
            {columnsMeta.map((c) => (
              <option key={c.status} value={c.status}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={modalLabel}>Prioridade</label>
          <select
            value={f.priority}
            onChange={(e) => store.patchTaskForm('priority')(e.target.value as Priority)}
            style={modalSelect}
          >
            {priorityOptions.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
        <label style={modalLabel}>Prazo (opcional)</label>
        <input
          type="date"
          value={f.dueDate}
          onChange={(e) => store.patchTaskForm('dueDate')(e.target.value)}
          style={{ ...modalInput, cursor: 'pointer' }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
        <label style={modalLabel}>Responsáveis</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
          {store.profiles.map((u) => {
            const on = f.assignees.includes(u.id)
            return (
              <button
                key={u.id}
                onClick={() => store.toggleAssignee(u.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '4px 10px 4px 4px',
                  borderRadius: '999px',
                  border: '1px solid ' + (on ? 'rgba(var(--primary-rgb),0.5)' : 'var(--border-light)'),
                  background: on ? 'var(--primary-subtle)' : 'var(--surface)',
                  color: on ? 'var(--primary)' : 'var(--text-secondary)',
                  fontFamily: 'var(--font-secondary)',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                <div style={avatarStyle(u, 22, 0)}>{initials(u.name)}</div>
                {u.name}
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
        <label style={modalLabel}>Referências</label>
        {f.refs.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {f.refs.map((r, idx) => {
              const isDoc = r.type === 'doc'
              const d = isDoc ? store.docs.find((x) => x.id === r.id) : null
              const p = !isDoc ? store.project(r.id) : null
              const label = isDoc ? d?.title || 'Documento' : p?.name || 'Projeto'
              return (
                <span
                  key={idx}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '4px 8px',
                    borderRadius: '7px',
                    background: isDoc ? 'var(--surface-light)' : 'var(--primary-subtle)',
                    border: '1px solid ' + (isDoc ? 'var(--border-light)' : 'rgba(var(--primary-rgb),0.3)'),
                    color: isDoc ? 'var(--text-secondary)' : 'var(--primary)',
                    fontFamily: 'var(--font-secondary)',
                    fontSize: '11.5px',
                  }}
                >
                  <Icon name={isDoc ? 'description' : 'folder'} size={13} />
                  {label}
                  <button
                    onClick={() => store.removeRef(idx)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'inherit',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      padding: 0,
                      marginLeft: '2px',
                    }}
                  >
                    <Icon name="close" size={14} />
                  </button>
                </span>
              )
            })}
          </div>
        )}
        <div style={{ display: 'flex', gap: '10px' }}>
          <select value="" onChange={(e) => store.addRef('doc', e.target.value)} style={refSelect}>
            <option value="">+ Vincular documentação…</option>
            {docRefOptions.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
          <select value="" onChange={(e) => store.addRef('project', e.target.value)} style={refSelect}>
            <option value="">+ Vincular projeto/subprojeto…</option>
            {projRefOptions.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
        {isEditing && (
          <Hoverable
            as="button"
            onClick={store.deleteTask}
            hoverStyle={dangerHover}
            style={{
              height: '42px',
              padding: '0 14px',
              borderRadius: '9px',
              background: 'transparent',
              border: '1px solid var(--border-light)',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-primary)',
              fontWeight: 600,
              fontSize: '12.5px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Icon name="delete" size={17} />
            Excluir
          </Hoverable>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: 'auto' }}>
          <button onClick={store.closeTask} style={cancelBtn}>
            Cancelar
          </button>
          <Hoverable
            as="button"
            onClick={store.saveTask}
            disabled={disabled}
            hoverStyle={disabled ? undefined : uploadBtnHover}
            style={primaryBtnStyle(disabled)}
          >
            <Icon name="check" size={18} />
            {isEditing ? 'Salvar' : 'Criar tarefa'}
          </Hoverable>
        </div>
      </div>
    </ModalShell>
  )
}

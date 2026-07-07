import { useEffect, useState, type CSSProperties } from 'react'
import type { Store } from '../store/useStore'
import type { Priority, Task } from '../lib/types'
import { Icon } from './ui/Icon'
import { Hoverable } from './ui/Hoverable'
import { badgeStyle, chipStyle, ghostHover } from './ui/styles'
import { columnsMeta, priorityMeta, priorityOptions } from '../lib/constants'
import { avatarStyle, formatDate, initials, todayISO } from '../lib/format'

export function BoardView({ store }: { store: Store }) {
  const allTasks = store.tasks
  const docsAll = store.docs
  const [priFilter, setPriFilter] = useState<Priority | 'all'>('all')
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all')
  const [mode, setMode] = useState<'board' | 'list'>(
    () => (localStorage.getItem('biblioteca_board_mode') as 'board' | 'list') || 'board',
  )
  useEffect(() => {
    localStorage.setItem('biblioteca_board_mode', mode)
  }, [mode])

  const taskTops = (t: Task): Record<string, boolean> => {
    const set: Record<string, boolean> = {}
    if (t.projectId) set[store.topProjectId(t.projectId)] = true
    t.refs.forEach((r) => {
      if (r.type === 'project') set[store.topProjectId(r.id)] = true
      else if (r.type === 'doc') {
        const d = docsAll.find((x) => x.id === r.id)
        if (d) set[store.topProjectId(d.projectId)] = true
      }
    })
    return set
  }

  let boardTasks = store.boardProjFilter
    ? allTasks.filter((t) => taskTops(t)[store.boardProjFilter!])
    : allTasks
  if (priFilter !== 'all') boardTasks = boardTasks.filter((t) => t.priority === priFilter)
  if (assigneeFilter !== 'all') boardTasks = boardTasks.filter((t) => t.assignees.includes(assigneeFilter))

  const subtitle =
    boardTasks.length +
    (boardTasks.length === 1 ? ' tarefa' : ' tarefas') +
    ' · independentes das documentações' +
    (mode === 'board' ? ' — arraste entre as colunas' : '')

  const filters = [{ id: null as string | null, label: 'Todos', count: allTasks.length }].concat(
    store.myProjects().map((p) => ({
      id: p.id as string | null,
      label: p.name,
      count: allTasks.filter((t) => taskTops(t)[p.id]).length,
    })),
  )

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, background: 'var(--background)' }}>
      <div style={{ padding: '18px 24px 6px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <div>
            <h1
              style={{
                fontFamily: 'var(--font-primary)',
                fontWeight: 700,
                fontSize: '20px',
                letterSpacing: '-0.01em',
                color: 'var(--text)',
                margin: '0 0 3px',
              }}
            >
              Quadro de tarefas
            </h1>
            <p style={{ fontFamily: 'var(--font-secondary)', fontSize: '12.5px', color: 'var(--text-muted)', margin: 0 }}>
              {subtitle}
            </p>
          </div>
          <div
            style={{
              display: 'flex',
              gap: '2px',
              padding: '2px',
              borderRadius: '9px',
              background: 'var(--surface)',
              border: '1px solid var(--border-light)',
              flex: 'none',
            }}
          >
            {(['board', 'list'] as const).map((m) => {
              const on = mode === m
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  title={m === 'board' ? 'Quadro' : 'Lista'}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '5px 11px',
                    borderRadius: '7px',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-primary)',
                    fontWeight: 600,
                    fontSize: '12px',
                    background: on ? 'var(--primary-subtle)' : 'transparent',
                    color: on ? 'var(--primary)' : 'var(--text-muted)',
                  }}
                >
                  <Icon name={m === 'board' ? 'view_kanban' : 'view_list'} size={16} />
                  {m === 'board' ? 'Quadro' : 'Lista'}
                </button>
              )
            })}
          </div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
          {filters.map((f) => {
            const active = store.boardProjFilter === f.id
            return (
              <Hoverable
                key={f.id ?? 'all'}
                as="button"
                onClick={() => store.setBoardProjFilter(f.id)}
                hoverStyle={active ? {} : { borderColor: 'rgba(var(--primary-rgb),0.4)', color: 'var(--text)' }}
                style={chipStyle(active)}
              >
                {f.label}
                <span style={badgeStyle(active)}>{f.count}</span>
              </Hoverable>
            )
          })}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
            {([{ id: 'all', label: 'Todas' }] as { id: Priority | 'all'; label: string }[])
              .concat(priorityOptions.map((o) => ({ id: o.id, label: o.label })))
              .map((o) => {
                const active = priFilter === o.id
                return (
                  <Hoverable
                    key={o.id}
                    as="button"
                    onClick={() => setPriFilter(o.id)}
                    hoverStyle={active ? {} : { borderColor: 'rgba(var(--primary-rgb),0.4)', color: 'var(--text)' }}
                    style={chipStyle(active)}
                  >
                    {o.label}
                  </Hoverable>
                )
              })}
          </div>
          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            style={{
              height: '30px',
              padding: '0 10px',
              borderRadius: '8px',
              background: 'var(--surface)',
              border: '1px solid var(--border-light)',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-secondary)',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            <option value="all">Todos os responsáveis</option>
            {store.profiles.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {mode === 'list' ? (
        <TaskList store={store} tasks={boardTasks} />
      ) : (
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: 'grid',
          gridTemplateColumns: 'repeat(4,minmax(250px,1fr))',
          gap: '14px',
          padding: '8px 24px 24px',
          overflowX: 'auto',
        }}
      >
        {columnsMeta.map((cm) => {
          const colTasks = boardTasks
            .filter((t) => t.status === cm.status)
            .sort((a, b) => a.position - b.position)
          return (
            <div
              key={cm.status}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                const dragId = store.dragIdRef.current
                store.dragIdRef.current = null
                if (dragId) {
                  const last = colTasks[colTasks.length - 1]
                  store.moveTask(dragId, cm.status, last ? last.position + 1000 : Date.now())
                }
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
                background: 'var(--surface-alt)',
                border: '1px solid var(--border-light)',
                borderRadius: '14px',
                padding: '14px 10px 10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '2px 4px 10px', flex: 'none' }}>
                <span style={{ width: '9px', height: '9px', borderRadius: '3px', background: cm.color, flex: 'none' }} />
                <span
                  style={{
                    fontFamily: 'var(--font-primary)',
                    fontWeight: 600,
                    fontSize: '12.5px',
                    color: 'var(--text)',
                    letterSpacing: '0.02em',
                  }}
                >
                  {cm.label}
                </span>
                <span
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: '10.5px',
                    color: 'var(--text-muted)',
                    background: 'var(--surface-light)',
                    borderRadius: '6px',
                    padding: '1px 7px',
                  }}
                >
                  {colTasks.length}
                </span>
                <Hoverable
                  as="button"
                  onClick={() => store.openTaskModal(cm.status)}
                  title="Nova tarefa"
                  hoverStyle={ghostHover}
                  style={{
                    marginLeft: 'auto',
                    width: '26px',
                    height: '26px',
                    borderRadius: '7px',
                    background: 'transparent',
                    border: '1px solid var(--border-light)',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon name="add" size={16} />
                </Hoverable>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '9px', padding: '2px' }}>
                {colTasks.map((t, i) => (
                  <TaskCard
                    key={t.id}
                    store={store}
                    task={t}
                    onReorder={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      const dragId = store.dragIdRef.current
                      store.dragIdRef.current = null
                      if (!dragId || dragId === t.id) return
                      const prev = colTasks[i - 1]
                      const prevPos = prev ? prev.position : t.position - 2000
                      store.moveTask(dragId, cm.status, (prevPos + t.position) / 2)
                    }}
                  />
                ))}
                {colTasks.length === 0 && (
                  <Hoverable
                    as="button"
                    onClick={() => store.openTaskModal(cm.status)}
                    hoverStyle={{ borderColor: 'rgba(var(--primary-rgb),0.5)', color: 'var(--text-secondary)' }}
                    style={{
                      border: '1.5px dashed var(--border-light)',
                      background: 'transparent',
                      borderRadius: '10px',
                      padding: '16px',
                      color: 'var(--text-muted)',
                      fontFamily: 'var(--font-secondary)',
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <Icon name="add" size={16} />
                    Adicionar tarefa
                  </Hoverable>
                )}
              </div>
            </div>
          )
        })}
      </div>
      )}
    </div>
  )
}

function TaskList({ store, tasks }: { store: Store; tasks: Task[] }) {
  const sorted = tasks.slice().sort((a, b) => {
    const sa = columnsMeta.findIndex((c) => c.status === a.status)
    const sb = columnsMeta.findIndex((c) => c.status === b.status)
    if (sa !== sb) return sa - sb
    return a.position - b.position
  })
  const projLabel = (t: Task) => {
    if (!t.projectId) return '—'
    const p = store.project(t.projectId)
    if (!p) return '—'
    return p.parentId ? `${store.project(p.parentId)?.name || ''} › ${p.name}` : p.name
  }
  const cell: CSSProperties = {
    fontFamily: 'var(--font-secondary)',
    fontSize: '12px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  }
  return (
    <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: '8px 24px 24px' }}>
      {sorted.length === 0 ? (
        <div
          style={{
            padding: '44px 20px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-secondary)',
            fontSize: '13px',
          }}
        >
          Nenhuma tarefa com esses filtros.
        </div>
      ) : (
        <div style={{ minWidth: '780px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '4px 12px',
              fontFamily: 'var(--font-primary)',
              fontWeight: 600,
              fontSize: '10.5px',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
            }}
          >
            <span style={{ flex: '2 1 200px' }}>Tarefa</span>
            <span style={{ flex: '1 1 140px' }}>Projeto</span>
            <span style={{ flex: '0 0 120px' }}>Status</span>
            <span style={{ flex: '0 0 90px' }}>Prioridade</span>
            <span style={{ flex: '0 0 110px' }}>Prazo</span>
            <span style={{ flex: '0 0 90px' }}>Resp.</span>
          </div>
          {sorted.map((t) => {
            const sm = columnsMeta.find((c) => c.status === t.status) || columnsMeta[0]
            const pri = priorityMeta[t.priority] || priorityMeta.med
            const overdue = !!t.dueDate && t.status !== 'done' && t.dueDate < todayISO()
            return (
              <Hoverable
                key={t.id}
                onClick={() => store.openTask(t.id)}
                hoverStyle={{ borderColor: 'rgba(var(--primary-rgb),0.45)', background: 'var(--surface-elevated)' }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  background: 'var(--surface)',
                  border: '1px solid var(--border-light)',
                  cursor: 'pointer',
                  transition: 'border-color 200ms, background 200ms',
                }}
              >
                <span style={{ ...cell, flex: '2 1 200px', fontFamily: 'var(--font-primary)', fontWeight: 600, color: 'var(--text)' }}>
                  {t.title}
                </span>
                <span style={{ ...cell, flex: '1 1 140px', color: 'var(--text-muted)' }}>{projLabel(t)}</span>
                <span style={{ flex: '0 0 120px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontFamily: 'var(--font-secondary)', fontSize: '11px', color: 'var(--text-secondary)' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '3px', background: sm.color, flex: 'none' }} />
                    {sm.label}
                  </span>
                </span>
                <span style={{ flex: '0 0 90px', display: 'inline-flex', alignItems: 'center', gap: '5px', fontFamily: 'var(--font-secondary)', fontSize: '11px', color: pri.color }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: pri.color, flex: 'none' }} />
                  {pri.label}
                </span>
                <span style={{ ...cell, flex: '0 0 110px', color: overdue ? '#F87171' : 'var(--text-secondary)' }}>
                  {t.dueDate ? formatDate(t.dueDate) : '—'}
                </span>
                <span style={{ flex: '0 0 90px', display: 'flex', alignItems: 'center' }}>
                  {t.assignees.slice(0, 3).map((uid, i) => {
                    const u = store.user(uid)
                    return (
                      <div key={uid} style={avatarStyle(u, 22, i)} title={u.name}>
                        {initials(u.name)}
                      </div>
                    )
                  })}
                </span>
              </Hoverable>
            )
          })}
        </div>
      )}
    </div>
  )
}

function TaskCard({
  store,
  task,
  onReorder,
}: {
  store: Store
  task: Task
  onReorder: (e: React.DragEvent) => void
}) {
  const pri = priorityMeta[task.priority] || priorityMeta.med
  const docsAll = store.docs
  const overdue = !!task.dueDate && task.status !== 'done' && task.dueDate < todayISO()

  const refChips = task.refs.map((r, idx) => {
    if (r.type === 'doc') {
      const d = docsAll.find((x) => x.id === r.id)
      return {
        key: 'd' + idx,
        icon: 'description',
        label: d ? d.title : 'Documento',
        onClick: (e: React.MouseEvent) => {
          e.stopPropagation()
          store.openDocRef(r.id)
        },
        style: {
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          maxWidth: '100%',
          padding: '2px 7px',
          borderRadius: '6px',
          background: 'var(--surface-light)',
          border: '1px solid var(--border-light)',
          color: 'var(--text-secondary)',
          fontFamily: 'var(--font-secondary)',
          fontSize: '10.5px',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        } as CSSProperties,
      }
    }
    const p = store.project(r.id)
    return {
      key: 'p' + idx,
      icon: 'folder',
      label: p ? p.name : 'Projeto',
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation()
        store.openProjectRef(r.id)
      },
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 7px',
        borderRadius: '6px',
        background: 'var(--primary-subtle)',
        border: '1px solid rgba(var(--primary-rgb),0.3)',
        color: 'var(--primary)',
        fontFamily: 'var(--font-secondary)',
        fontSize: '10.5px',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      } as CSSProperties,
    }
  })

  return (
    <Hoverable
      draggable
      onDragStart={(e: React.DragEvent) => {
        store.dragIdRef.current = task.id
        if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'
      }}
      onDragOver={(e: React.DragEvent) => e.preventDefault()}
      onDrop={onReorder}
      onClick={() => store.openTask(task.id)}
      hoverStyle={{ borderColor: 'rgba(var(--primary-rgb),0.45)', boxShadow: 'var(--elevation-2)' }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '12px',
        borderRadius: '11px',
        background: 'var(--surface)',
        border: '1px solid var(--border-light)',
        cursor: 'grab',
        transition: 'transform 150ms var(--ease-standard), border-color 200ms, box-shadow 200ms',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            fontFamily: 'var(--font-primary)',
            fontWeight: 600,
            fontSize: '10px',
            letterSpacing: '0.03em',
            textTransform: 'uppercase',
            color: pri.color,
          }}
        >
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: pri.color }} />
          {pri.label}
        </span>
      </div>
      <div style={{ fontFamily: 'var(--font-primary)', fontWeight: 600, fontSize: '13px', color: 'var(--text)', lineHeight: 1.35 }}>
        {task.title}
      </div>
      {task.description && (
        <div
          style={{
            fontFamily: 'var(--font-secondary)',
            fontSize: '11.5px',
            color: 'var(--text-muted)',
            lineHeight: 1.45,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {task.description}
        </div>
      )}
      {refChips.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
          {refChips.map((r) => (
            <span key={r.key} onClick={r.onClick} style={r.style}>
              <Icon name={r.icon} size={12} />
              {r.label}
            </span>
          ))}
        </div>
      )}
      {task.dueDate && (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            alignSelf: 'flex-start',
            padding: '2px 8px',
            borderRadius: '6px',
            fontFamily: 'var(--font-secondary)',
            fontSize: '10.5px',
            background: overdue ? 'rgba(220,53,69,0.14)' : 'var(--surface-light)',
            border: '1px solid ' + (overdue ? 'rgba(220,53,69,0.4)' : 'var(--border-light)'),
            color: overdue ? '#F87171' : 'var(--text-secondary)',
          }}
          title={overdue ? 'Prazo vencido' : 'Prazo'}
        >
          <Icon name="event" size={12} />
          {formatDate(task.dueDate)}
        </span>
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginTop: '2px' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {task.assignees.slice(0, 4).map((uid, i) => {
            const u = store.user(uid)
            return (
              <div key={uid} style={avatarStyle(u, 24, i)} title={u.name}>
                {initials(u.name)}
              </div>
            )
          })}
        </div>
        <Icon name="drag_indicator" size={15} style={{ color: 'var(--text-muted)', opacity: 0.6 }} />
      </div>
    </Hoverable>
  )
}

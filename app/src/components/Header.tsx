import { useState, type CSSProperties } from 'react'
import type { Store } from '../store/useStore'
import { Icon } from './ui/Icon'
import { Hoverable } from './ui/Hoverable'
import { ghostHover, navBtnStyle, uploadBtnHover } from './ui/styles'
import { initials } from '../lib/format'
import { accents } from '../lib/accents'

const ghostBtn: CSSProperties = {
  width: '40px',
  height: '40px',
  borderRadius: '10px',
  background: 'transparent',
  border: '1px solid var(--border-light)',
  color: 'var(--text-secondary)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

export function Header({
  store,
  onLogout,
  theme,
  onToggleTheme,
  accent,
  onSetAccent,
}: {
  store: Store
  onLogout: () => void
  theme: 'dark' | 'light'
  onToggleTheme: () => void
  accent: string
  onSetAccent: (id: string) => void
}) {
  const [accentOpen, setAccentOpen] = useState(false)
  const { view, currentProjectId, currentSubId } = store
  const isLibrary = view === 'library' && !!currentProjectId
  const curProj = store.project(currentProjectId)
  const curSub = currentSubId ? store.project(currentSubId) : null
  const me = store.user(store.me)
  const showPrimary = view === 'library' || view === 'board'
  const projMembers = curProj ? curProj.members : []

  return (
    <header
      style={{
        height: '64px',
        flex: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        padding: '0 22px',
        background: 'var(--header-bg)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border)',
        zIndex: 10,
      }}
    >
      <div
        onClick={store.goProjects}
        style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', flex: 'none' }}
      >
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '11px',
            background: 'var(--gradient-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontFamily: 'var(--font-primary)',
            fontWeight: 700,
            fontSize: '14px',
            letterSpacing: '0.02em',
          }}
        >
          AP
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
          <span
            style={{
              fontFamily: 'var(--font-primary)',
              fontWeight: 600,
              fontSize: '15px',
              color: 'var(--text)',
              letterSpacing: '-0.01em',
            }}
          >
            Biblioteca de Documentações
          </span>
          <span
            style={{
              fontFamily: 'var(--font-secondary)',
              fontSize: '11px',
              color: 'var(--text-muted)',
              letterSpacing: '0.03em',
            }}
          >
            Base de conhecimento pessoal
          </span>
        </div>
      </div>

      {isLibrary && curProj && (
        <>
          <span style={{ color: 'var(--text-muted)', fontSize: '18px', margin: '0 2px' }}>/</span>
          <div
            onClick={() => store.selectSub(null)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              borderRadius: '10px',
              background: 'var(--surface)',
              border: '1px solid var(--border-light)',
              minWidth: 0,
              cursor: 'pointer',
            }}
          >
            <span
              style={{
                width: '9px',
                height: '9px',
                borderRadius: '50%',
                background: curProj.color || 'var(--primary)',
                flex: 'none',
              }}
            />
            <span
              style={{
                fontFamily: 'var(--font-primary)',
                fontWeight: 600,
                fontSize: '13px',
                color: 'var(--text)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '180px',
              }}
            >
              {curProj.name}
            </span>
          </div>
          {curSub && (
            <>
              <span style={{ color: 'var(--text-muted)', fontSize: '16px' }}>›</span>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 12px',
                  borderRadius: '10px',
                  background: 'var(--primary-subtle)',
                  border: '1px solid rgba(var(--primary-rgb),0.35)',
                  minWidth: 0,
                }}
              >
                <span
                  style={{
                    width: '9px',
                    height: '9px',
                    borderRadius: '50%',
                    background: curSub.color || 'var(--primary)',
                    flex: 'none',
                  }}
                />
                <span
                  style={{
                    fontFamily: 'var(--font-primary)',
                    fontWeight: 600,
                    fontSize: '13px',
                    color: 'var(--text)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '170px',
                  }}
                >
                  {curSub.name}
                </span>
              </div>
            </>
          )}
        </>
      )}

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px', flex: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button onClick={store.goProjects} style={navBtnStyle(view === 'projects' || view === 'library')}>
            <Icon name="grid_view" size={18} />
            Projetos
          </button>
          <button onClick={store.goBoard} style={navBtnStyle(view === 'board')}>
            <Icon name="view_kanban" size={18} />
            Quadro
          </button>
        </div>

        {isLibrary && (
          <Hoverable
            as="button"
            onClick={store.openMembers}
            title="Membros do projeto"
            hoverStyle={ghostHover}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              height: '40px',
              padding: '0 12px',
              borderRadius: '10px',
              background: 'transparent',
              border: '1px solid var(--border-light)',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-primary)',
              fontWeight: 600,
              fontSize: '12.5px',
              cursor: 'pointer',
            }}
          >
            <Icon name="group" size={18} />
            {projMembers.length}
          </Hoverable>
        )}

        {showPrimary && (
          <Hoverable
            as="button"
            onClick={view === 'board' ? () => store.openTaskModal('todo') : store.openUpload}
            hoverStyle={uploadBtnHover}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              height: '40px',
              padding: '0 16px',
              border: 'none',
              borderRadius: '10px',
              background: 'var(--gradient-primary)',
              color: '#fff',
              fontFamily: 'var(--font-primary)',
              fontWeight: 700,
              fontSize: '13px',
              letterSpacing: '0.04em',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(var(--primary-rgb),0.28)',
              transition: 'transform 200ms var(--ease-standard),box-shadow 200ms',
            }}
          >
            <Icon name={view === 'board' ? 'add_task' : 'upload_file'} size={19} />
            {view === 'board' ? 'Nova tarefa' : 'Subir documento'}
          </Hoverable>
        )}

        <div style={{ position: 'relative' }}>
          <Hoverable
            as="button"
            onClick={() => setAccentOpen((o) => !o)}
            title="Cor de destaque"
            aria-label="Cor de destaque"
            hoverStyle={ghostHover}
            style={ghostBtn}
          >
            <Icon name="palette" size={19} />
          </Hoverable>
          {accentOpen && (
            <>
              <div
                onClick={() => setAccentOpen(false)}
                style={{ position: 'fixed', inset: 0, zIndex: 40 }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: '48px',
                  right: 0,
                  zIndex: 41,
                  display: 'flex',
                  gap: '8px',
                  padding: '10px',
                  borderRadius: '12px',
                  background: 'var(--surface-elevated)',
                  border: '1px solid var(--border-light)',
                  boxShadow: 'var(--elevation-3)',
                }}
              >
                {accents.map((a) => {
                  const active = accent === a.id
                  return (
                    <button
                      key={a.id}
                      onClick={() => {
                        onSetAccent(a.id)
                        setAccentOpen(false)
                      }}
                      title={a.label}
                      aria-label={a.label}
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        background: a.swatch,
                        border: '2px solid ' + (active ? 'var(--text)' : 'transparent'),
                        cursor: 'pointer',
                        flex: 'none',
                      }}
                    />
                  )
                })}
              </div>
            </>
          )}
        </div>

        <Hoverable
          as="button"
          onClick={store.refresh}
          title="Atualizar"
          hoverStyle={ghostHover}
          style={ghostBtn}
        >
          <Icon name="refresh" size={19} />
        </Hoverable>

        <Hoverable
          as="button"
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
          hoverStyle={ghostHover}
          style={ghostBtn}
        >
          <Icon name={theme === 'dark' ? 'light_mode' : 'dark_mode'} size={19} />
        </Hoverable>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '6px 8px 6px 6px',
            borderRadius: '16px',
            border: '1px solid var(--border-light)',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'var(--gradient-primary)',
              color: '#fff',
              fontFamily: 'var(--font-primary)',
              fontWeight: 700,
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {initials(me.name)}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15, maxWidth: '150px' }}>
            <span
              style={{
                fontFamily: 'var(--font-secondary)',
                fontWeight: 600,
                fontSize: '12px',
                color: 'var(--text)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {me.email}
            </span>
            <span style={{ fontFamily: 'var(--font-secondary)', fontSize: '10.5px', color: 'var(--text-muted)' }}>
              Sessão ativa
            </span>
          </div>
        </div>

        <Hoverable as="button" onClick={onLogout} title="Sair" hoverStyle={ghostHover} style={ghostBtn}>
          <Icon name="logout" size={19} />
        </Hoverable>
      </div>
    </header>
  )
}

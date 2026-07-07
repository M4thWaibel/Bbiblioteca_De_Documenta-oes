import type { Store } from '../../store/useStore'
import { Icon } from '../ui/Icon'
import { Hoverable } from '../ui/Hoverable'
import { dangerHover } from '../ui/styles'
import { avatarStyle, initials } from '../../lib/format'
import { ModalShell, ModalCloseButton, modalLabel, modalSelect } from './ModalShell'

export function MembersModal({ store }: { store: Store }) {
  const curProj = store.project(store.currentProjectId)
  const projMembers = curProj ? curProj.members : []
  const addable = store.profiles.filter((u) => !projMembers.includes(u.id))

  return (
    <ModalShell onClose={store.closeMembers} width={500}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '18px' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-primary)', fontWeight: 600, fontSize: '18px', color: 'var(--text)' }}>
            Membros de {curProj?.name}
          </div>
          <div style={{ fontFamily: 'var(--font-secondary)', fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '3px' }}>
            Quem tem acesso às documentações e tarefas deste projeto.
          </div>
        </div>
        <ModalCloseButton onClose={store.closeMembers} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
        {projMembers.map((uid) => {
          const u = store.user(uid)
          const isOwner = curProj && uid === curProj.ownerId
          return (
            <div
              key={uid}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                borderRadius: '10px',
                background: 'var(--surface)',
                border: '1px solid var(--border-light)',
              }}
            >
              <div style={avatarStyle(u, 38, 0)}>{initials(u.name)}</div>
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                <span style={{ fontFamily: 'var(--font-primary)', fontWeight: 600, fontSize: '13px', color: 'var(--text)' }}>
                  {u.name}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-secondary)',
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {u.email}
                </span>
              </div>
              {isOwner ? (
                <span
                  style={{
                    fontFamily: 'var(--font-primary)',
                    fontWeight: 600,
                    fontSize: '10px',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    color: 'var(--primary)',
                    background: 'var(--primary-subtle)',
                    border: '1px solid rgba(var(--primary-rgb),0.3)',
                    borderRadius: '6px',
                    padding: '3px 8px',
                  }}
                >
                  Dono
                </span>
              ) : (
                <Hoverable
                  as="button"
                  onClick={() => store.removeMember(uid)}
                  title="Remover"
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
                  }}
                >
                  <Icon name="person_remove" size={16} />
                </Hoverable>
              )}
            </div>
          )
        })}
      </div>

      {addable.length > 0 ? (
        <>
          <label style={modalLabel}>Adicionar membro</label>
          <select
            value=""
            onChange={(e) => {
              const uid = e.target.value
              if (uid) store.addMember(uid)
            }}
            style={{ ...modalSelect, width: '100%', marginTop: '6px' }}
          >
            <option value="">Selecione um usuário…</option>
            {addable.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} · {u.email}
              </option>
            ))}
          </select>
        </>
      ) : (
        <div style={{ fontFamily: 'var(--font-secondary)', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '8px' }}>
          Todos os usuários registrados já são membros.
        </div>
      )}
    </ModalShell>
  )
}

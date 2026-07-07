import type { Store } from '../store/useStore'
import { Icon } from './ui/Icon'
import { Hoverable } from './ui/Hoverable'
import { dangerHover, dashedHover, ghostHover, uploadBtnHover } from './ui/styles'
import { avatarStyle, initials } from '../lib/format'

export function ProjectsView({ store }: { store: Store }) {
  const list = store.myProjects()

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: 'var(--background)' }}>
      <div style={{ maxWidth: '1080px', margin: '0 auto', padding: '40px 40px 80px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: 'var(--font-primary)',
                fontWeight: 700,
                fontSize: '28px',
                letterSpacing: '-0.02em',
                color: 'var(--text)',
                margin: '0 0 6px',
              }}
            >
              Seus projetos
            </h1>
            <p
              style={{
                fontFamily: 'var(--font-secondary)',
                fontSize: '14px',
                color: 'var(--text-secondary)',
                margin: 0,
              }}
            >
              Selecione um projeto para ver suas documentações e subprojetos. O quadro de tarefas fica
              em <strong style={{ color: 'var(--primary)' }}>Quadro</strong>, no topo.
            </p>
          </div>
          <Hoverable
            as="button"
            onClick={store.openProjModal}
            hoverStyle={uploadBtnHover}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              height: '42px',
              padding: '0 18px',
              border: 'none',
              borderRadius: '10px',
              background: 'var(--gradient-primary)',
              color: '#fff',
              fontFamily: 'var(--font-primary)',
              fontWeight: 700,
              fontSize: '13px',
              letterSpacing: '0.03em',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(var(--primary-rgb),0.28)',
            }}
          >
            <Icon name="add" size={19} />
            Novo projeto
          </Hoverable>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))',
            gap: '16px',
            marginTop: '26px',
          }}
        >
          {list.map((p) => {
            const treeIds = store.projectTreeIds(p.id)
            const docCount = store.docs.filter((d) => treeIds.includes(d.projectId)).length
            const subCount = store.subprojects(p.id).length
            const mem = p.members
            const avatars = mem.slice(0, 4)
            const extra = mem.length - 4
            return (
              <Hoverable
                key={p.id}
                onClick={() => store.openProject(p.id)}
                hoverStyle={{
                  transform: 'translateY(-3px)',
                  boxShadow: 'var(--elevation-3)',
                  borderColor: 'rgba(var(--primary-rgb),0.4)',
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  minHeight: '176px',
                  padding: '18px',
                  borderRadius: '14px',
                  border: '1px solid var(--border-light)',
                  borderTop: '3px solid ' + (p.color || 'var(--primary)'),
                  background: 'var(--surface)',
                  cursor: 'pointer',
                  transition:
                    'transform 200ms var(--ease-standard), border-color 200ms, box-shadow 200ms',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    <span
                      style={{
                        width: '11px',
                        height: '11px',
                        borderRadius: '50%',
                        background: p.color || 'var(--primary)',
                        flex: 'none',
                        boxShadow: '0 0 8px ' + (p.color || '#E5484D') + '66',
                      }}
                    />
                    <span
                      style={{
                        fontFamily: 'var(--font-primary)',
                        fontWeight: 700,
                        fontSize: '16px',
                        color: 'var(--text)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {p.name}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flex: 'none' }}>
                    <Hoverable
                      as="button"
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation()
                        store.openEditProject(p.id)
                      }}
                      title="Editar projeto"
                      hoverStyle={ghostHover}
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
                      <Icon name="edit" size={15} />
                    </Hoverable>
                    <Hoverable
                      as="button"
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation()
                        store.deleteProject(p.id)
                      }}
                      title="Excluir projeto"
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
                      <Icon name="delete" size={16} />
                    </Hoverable>
                  </div>
                </div>

                <p
                  style={{
                    fontFamily: 'var(--font-secondary)',
                    fontSize: '12.5px',
                    color: 'var(--text-muted)',
                    lineHeight: 1.55,
                    margin: '2px 0 0',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    minHeight: '38px',
                  }}
                >
                  {p.description}
                </p>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: 'auto',
                    paddingTop: '14px',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {avatars.map((uid, i) => {
                      const u = store.user(uid)
                      return (
                        <div key={uid} style={avatarStyle(u, 28, i)} title={u.name}>
                          {initials(u.name)}
                        </div>
                      )
                    })}
                    {extra > 0 && (
                      <div
                        style={{
                          ...avatarStyle({ color: 'var(--surface-light)' }, 28, 1),
                          color: 'var(--text-secondary)',
                        }}
                      >
                        +{extra}
                      </div>
                    )}
                  </div>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontFamily: 'var(--font-secondary)',
                      fontSize: '11.5px',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <Icon name="description" size={15} />
                    {docCount}
                    <span style={{ color: 'var(--border-light)' }}>·</span>
                    <Icon name="account_tree" size={15} />
                    {subCount}
                  </span>
                </div>
              </Hoverable>
            )
          })}

          <Hoverable
            onClick={store.openProjModal}
            hoverStyle={dashedHover}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              minHeight: '176px',
              borderRadius: '14px',
              border: '1.5px dashed var(--border-light)',
              background: 'var(--surface-alt)',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              transition: 'border-color 200ms, color 200ms',
            }}
          >
            <Icon name="create_new_folder" size={30} style={{ color: 'var(--primary)' }} />
            <span
              style={{
                fontFamily: 'var(--font-primary)',
                fontWeight: 600,
                fontSize: '13.5px',
                color: 'var(--text-secondary)',
              }}
            >
              Novo projeto
            </span>
          </Hoverable>
        </div>
      </div>
    </div>
  )
}

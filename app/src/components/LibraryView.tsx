import { useMemo, type CSSProperties } from 'react'
import type { Store } from '../store/useStore'
import { Icon } from './ui/Icon'
import { Hoverable } from './ui/Hoverable'
import { badgeStyle, chipStyle, dangerHover, ghostHover, subChipStyle } from './ui/styles'
import { cat as getCat, catColors, cats } from '../lib/constants'
import { formatDate, readingTime } from '../lib/format'
import { mdToHtml } from '../lib/markdown'
import { MarkdownArticle } from './MarkdownArticle'

const ghostAction: CSSProperties = {
  width: '38px',
  height: '38px',
  borderRadius: '9px',
  background: 'transparent',
  border: '1px solid var(--border-light)',
  color: 'var(--text-secondary)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

export function LibraryView({ store }: { store: Store }) {
  const topId = store.currentProjectId!
  const curProj = store.project(topId)
  const subsList = store.subprojects(topId)
  const treeDocIds = store.projectTreeIds(topId)
  const docsAll = store.docs

  // ---- escopo (todo o projeto ou um subprojeto) ----
  const scopeDocIds = store.currentSubId ? [store.currentSubId] : treeDocIds
  const scopedDocs = docsAll.filter((d) => scopeDocIds.includes(d.projectId))
  const q = store.query.trim().toLowerCase()
  // #4/#10: resultados de conteúdo vêm do servidor (RPC). Metadados (título,
  // descrição, tags) continuam filtrados localmente para resposta instantânea.
  const hitById = new Map(store.searchHits.map((h) => [h.id, h]))
  const otherHits = q ? store.searchHits.filter((h) => !scopeDocIds.includes(h.projectId)) : []

  // ---- filtros de categoria ----
  const catCount: Record<string, number> = {}
  scopedDocs.forEach((d) => {
    catCount[d.category] = (catCount[d.category] || 0) + 1
  })

  const catChips: { id: string; label: string; icon: string; count: number }[] = [
    { id: 'all', label: 'Todos', icon: 'apps', count: scopedDocs.length },
    { id: 'pinned', label: 'Fixados', icon: 'push_pin', count: scopedDocs.filter((d) => d.pinned).length },
  ]
  cats.forEach((c) => {
    if (catCount[c.id]) catChips.push({ id: c.id, label: c.label, icon: c.icon, count: catCount[c.id] })
  })

  // ---- aplica filtros ----
  let filtered = scopedDocs.slice()
  if (store.cat === 'pinned') filtered = filtered.filter((d) => d.pinned)
  else if (store.cat !== 'all') filtered = filtered.filter((d) => d.category === store.cat)
  if (store.tag)
    filtered = filtered.filter((d) => d.tags.some((t) => t.toLowerCase() === store.tag!.toLowerCase()))
  if (q)
    filtered = filtered.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        d.tags.some((t) => t.toLowerCase().includes(q)) ||
        hitById.has(d.id),
    )
  filtered.sort((a, b) => {
    if (q) {
      const ra = hitById.get(a.id)?.rank ?? 0
      const rb = hitById.get(b.id)?.rank ?? 0
      if (rb !== ra) return rb - ra
    }
    if (!!b.pinned !== !!a.pinned) return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)
    return (b.updatedAt || '').localeCompare(a.updatedAt || '')
  })

  const searching = !!(q || store.cat !== 'all' || store.tag)
  const resultLabel = searching
    ? filtered.length + (filtered.length === 1 ? ' resultado' : ' resultados')
    : scopedDocs.length + (scopedDocs.length === 1 ? ' documento' : ' documentos')

  const activeDoc = scopedDocs.find((d) => d.id === store.activeId) || null

  return (
    <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
      {/* ===================== ASIDE ===================== */}
      <aside
        style={{
          width: '380px',
          flex: 'none',
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid var(--border-light)',
          background: 'var(--surface-alt)',
          minHeight: 0,
        }}
      >
        {/* subprojetos */}
        <div
          style={{
            padding: '14px 18px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            borderBottom: '1px solid var(--border-light)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <span
              style={{
                fontFamily: 'var(--font-primary)',
                fontWeight: 600,
                fontSize: '10.5px',
                letterSpacing: '0.09em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
              }}
            >
              Subprojetos
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {store.currentSubId && (
                <>
                  <Hoverable
                    as="button"
                    onClick={() => store.openEditProject(store.currentSubId!)}
                    title="Editar subprojeto"
                    hoverStyle={ghostHover}
                    style={{
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
                    <Icon name="edit" size={14} />
                  </Hoverable>
                  <Hoverable
                    as="button"
                    onClick={() => store.deleteProject(store.currentSubId!)}
                    title="Excluir subprojeto"
                    hoverStyle={dangerHover}
                    style={{
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
                    <Icon name="delete" size={15} />
                  </Hoverable>
                </>
              )}
              <Hoverable
                as="button"
                onClick={store.openSubprojModal}
                title="Novo subprojeto"
                hoverStyle={ghostHover}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  height: '26px',
                  padding: '0 9px',
                  borderRadius: '7px',
                  background: 'transparent',
                  border: '1px solid var(--border-light)',
                  color: 'var(--text-secondary)',
                  fontFamily: 'var(--font-primary)',
                  fontWeight: 600,
                  fontSize: '11px',
                  cursor: 'pointer',
                }}
              >
                <Icon name="add" size={15} />
                Subprojeto
              </Hoverable>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            <SubChip
              active={!store.currentSubId}
              label="Todo o projeto"
              count={docsAll.filter((d) => treeDocIds.includes(d.projectId)).length}
              dotColor={(curProj && curProj.color) || 'var(--primary)'}
              onClick={() => store.selectSub(null)}
            />
            {subsList.map((s) => (
              <SubChip
                key={s.id}
                active={store.currentSubId === s.id}
                label={s.name}
                count={docsAll.filter((d) => d.projectId === s.id).length}
                dotColor={s.color || 'var(--primary)'}
                onClick={() => store.selectSub(s.id)}
              />
            ))}
          </div>
        </div>

        {/* busca + filtros de categoria */}
        <div
          style={{
            padding: '16px 18px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            borderBottom: '1px solid var(--border-light)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              height: '44px',
              padding: '0 12px',
              background: 'var(--surface)',
              border: '1px solid var(--border-light)',
              borderRadius: '11px',
            }}
          >
            <Icon name="search" size={20} style={{ color: 'var(--text-muted)' }} />
            <input
              value={store.query}
              onChange={(e) => store.setQuery(e.target.value)}
              placeholder="Buscar documento ou conteúdo…"
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text)',
                fontFamily: 'var(--font-secondary)',
                fontSize: '13.5px',
                flex: 1,
              }}
            />
            {store.query && (
              <button
                onClick={() => store.setQuery('')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '2px',
                }}
              >
                <Icon name="close" size={18} />
              </button>
            )}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
            {catChips.map((c) => {
              const active = store.cat === c.id
              return (
                <Hoverable
                  key={c.id}
                  as="button"
                  onClick={() => store.setCat(c.id)}
                  hoverStyle={active ? {} : { borderColor: 'rgba(var(--primary-rgb),0.4)', color: 'var(--text)' }}
                  style={chipStyle(active)}
                >
                  <Icon name={c.icon} size={15} />
                  <span>{c.label}</span>
                  <span style={badgeStyle(active)}>{c.count}</span>
                </Hoverable>
              )
            })}
          </div>
          {store.tag && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                alignSelf: 'flex-start',
                padding: '5px 8px 5px 11px',
                borderRadius: '8px',
                background: 'var(--primary-subtle)',
                border: '1px solid rgba(var(--primary-rgb),0.4)',
                color: 'var(--primary)',
                fontFamily: 'var(--font-primary)',
                fontWeight: 600,
                fontSize: '11.5px',
              }}
            >
              <Icon name="sell" size={14} />
              {store.tag}
              <button
                onClick={() => store.setTag(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--primary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Icon name="close" size={16} />
              </button>
            </div>
          )}
        </div>

        {/* label resultado */}
        <div style={{ padding: '12px 18px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span
            style={{
              fontFamily: 'var(--font-primary)',
              fontWeight: 600,
              fontSize: '10.5px',
              letterSpacing: '0.09em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
            }}
          >
            {resultLabel}
          </span>
        </div>

        {/* lista de documentos */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '2px 12px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {filtered.map((d) => {
            const c = getCat(d.category)
            const cc = catColors[c.color]
            const active = d.id === store.activeId
            const hit = q ? hitById.get(d.id) : undefined
            return (
              <Hoverable
                key={d.id}
                onClick={() => store.openDoc(d.id)}
                hoverStyle={active ? {} : { transform: 'translateY(-2px)', borderColor: 'rgba(var(--primary-rgb),0.4)' }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  padding: '14px',
                  borderRadius: '12px',
                  border: '1px solid',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'transform 200ms var(--ease-standard), border-color 200ms, background 200ms',
                  background: active ? 'var(--surface-elevated)' : 'var(--surface)',
                  borderColor: active ? 'rgba(var(--primary-rgb),0.6)' : 'var(--border-light)',
                  boxShadow: active ? 'var(--glow-primary)' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <span style={catChipStyle(cc, false)}>
                    <Icon name={c.icon} size={13} />
                    {c.label}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      store.togglePin(d.id)
                    }}
                    title="Fixar"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '2px',
                      color: d.pinned ? 'var(--primary)' : 'var(--text-muted)',
                      opacity: d.pinned ? 1 : 0.6,
                    }}
                  >
                    <Icon name="push_pin" size={17} />
                  </button>
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-primary)',
                    fontWeight: 600,
                    fontSize: '14px',
                    color: 'var(--text)',
                    lineHeight: 1.35,
                  }}
                >
                  {d.title}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-secondary)',
                    fontSize: '12px',
                    color: 'var(--text-muted)',
                    lineHeight: 1.5,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {d.description}
                </div>
                {hit?.headline && (
                  <div
                    style={{
                      fontFamily: 'var(--font-secondary)',
                      fontSize: '11px',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.55,
                      background: 'var(--surface-light)',
                      border: '1px solid var(--border-light)',
                      borderRadius: '7px',
                      padding: '6px 8px',
                    }}
                  >
                    <Snippet text={hit.headline} />
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '2px' }}>
                  {d.tags.map((t) => (
                    <span
                      key={t}
                      style={{
                        fontFamily: 'var(--font-secondary)',
                        fontSize: '10.5px',
                        color: 'var(--text-secondary)',
                        background: 'var(--surface-light)',
                        border: '1px solid var(--border-light)',
                        borderRadius: '6px',
                        padding: '2px 7px',
                      }}
                    >
                      {t}
                    </span>
                  ))}
                  {hit && (
                    <span
                      style={{
                        marginLeft: 'auto',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontFamily: 'var(--font-secondary)',
                        fontSize: '10.5px',
                        color: 'var(--primary)',
                      }}
                      title="Correspondência no conteúdo"
                    >
                      <Icon name="find_in_page" size={13} />
                      no conteúdo
                    </span>
                  )}
                </div>
              </Hoverable>
            )
          })}
          {filtered.length === 0 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px',
                textAlign: 'center',
                padding: '44px 20px',
                color: 'var(--text-muted)',
              }}
            >
              <Icon name={searching ? 'search_off' : 'note_add'} size={44} style={{ opacity: 0.5 }} />
              <div style={{ fontFamily: 'var(--font-primary)', fontWeight: 600, fontSize: '14px', color: 'var(--text-secondary)' }}>
                {searching ? 'Nenhum documento encontrado' : 'Projeto ainda sem documentos'}
              </div>
              <div style={{ fontFamily: 'var(--font-secondary)', fontSize: '12.5px', maxWidth: '230px', lineHeight: 1.5 }}>
                {searching
                  ? 'Ajuste a busca ou os filtros deste projeto.'
                  : 'Use "Subir documento" para adicionar a primeira documentação aqui.'}
              </div>
            </div>
          )}
          {otherHits.length > 0 && (
            <div
              style={{
                marginTop: '8px',
                paddingTop: '12px',
                borderTop: '1px solid var(--border-light)',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-primary)',
                  fontWeight: 600,
                  fontSize: '10.5px',
                  letterSpacing: '0.09em',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  padding: '0 2px 2px',
                }}
              >
                Em outros projetos · {otherHits.length}
              </span>
              {otherHits.map((h) => {
                const hp = store.project(h.projectId)
                return (
                  <Hoverable
                    as="button"
                    key={h.id}
                    onClick={() => store.openDocRef(h.id)}
                    hoverStyle={{ borderColor: 'rgba(var(--primary-rgb),0.4)' }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      textAlign: 'left',
                      padding: '9px 11px',
                      borderRadius: '10px',
                      background: 'var(--surface)',
                      border: '1px solid var(--border-light)',
                      cursor: 'pointer',
                    }}
                  >
                    <Icon name="description" size={15} style={{ flex: 'none', color: 'var(--primary)' }} />
                    <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0, gap: '1px' }}>
                      <span
                        style={{
                          fontFamily: 'var(--font-primary)',
                          fontWeight: 600,
                          fontSize: '12px',
                          color: 'var(--text)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {h.title}
                      </span>
                      <span
                        style={{
                          fontFamily: 'var(--font-secondary)',
                          fontSize: '10.5px',
                          color: 'var(--text-muted)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {hp ? hp.name : 'Projeto'}
                      </span>
                    </span>
                  </Hoverable>
                )
              })}
            </div>
          )}
        </div>
      </aside>

      {/* ===================== MAIN ===================== */}
      <main style={{ flex: 1, minWidth: 0, display: 'flex', background: 'var(--background)' }}>
        {activeDoc ? (
          <Reader store={store} doc={activeDoc} />
        ) : (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '14px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              padding: '40px',
            }}
          >
            <div
              style={{
                width: '76px',
                height: '76px',
                borderRadius: '20px',
                background: 'var(--surface)',
                border: '1px solid var(--border-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)',
              }}
            >
              <Icon name="menu_book" size={38} />
            </div>
            <div style={{ fontFamily: 'var(--font-primary)', fontWeight: 600, fontSize: '17px', color: 'var(--text-secondary)' }}>
              {filtered.length ? 'Selecione um documento' : 'Nada para ler ainda'}
            </div>
            <div style={{ fontFamily: 'var(--font-secondary)', fontSize: '13px', maxWidth: '320px', lineHeight: 1.6 }}>
              {filtered.length
                ? 'Escolha uma documentação na lista à esquerda para começar a ler.'
                : 'Este projeto ainda não tem documentos. Suba um arquivo .md para começar.'}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

// ---------- chip de categoria (leitor/lista) ----------
function catChipStyle(cc: { bg: string; fg: string }, big: boolean): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: big ? '6px' : '5px',
    padding: big ? '5px 11px' : '3px 8px',
    borderRadius: big ? '7px' : '6px',
    background: cc.bg,
    color: cc.fg,
    fontFamily: 'var(--font-primary)',
    fontWeight: 600,
    fontSize: big ? '11px' : '10px',
    letterSpacing: big ? '0.04em' : '0.03em',
    textTransform: 'uppercase',
  }
}

// ---------- trecho da busca (marcadores « » -> <mark>, seguro via React) ----------
function Snippet({ text }: { text: string }) {
  const parts = text.split(/(«[^»]*»)/g)
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith('«') && p.endsWith('»') ? (
          <mark
            key={i}
            style={{ background: 'var(--primary-subtle)', color: 'var(--primary)', borderRadius: '3px', padding: '0 2px' }}
          >
            {p.slice(1, -1)}
          </mark>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  )
}

// ---------- chip de subprojeto ----------
function SubChip({
  active,
  label,
  count,
  dotColor,
  onClick,
}: {
  active: boolean
  label: string
  count: number
  dotColor: string
  onClick: () => void
}) {
  return (
    <Hoverable
      as="button"
      onClick={onClick}
      hoverStyle={active ? {} : { borderColor: 'rgba(var(--primary-rgb),0.4)', color: 'var(--text)' }}
      style={subChipStyle(active)}
    >
      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: dotColor, flex: 'none' }} />
      {label}
      <span style={badgeStyle(active)}>{count}</span>
    </Hoverable>
  )
}

// ---------- leitor do documento ----------
function Reader({ store, doc }: { store: Store; doc: import('../lib/types').Doc }) {
  const c = getCat(doc.category)
  const cc = catColors[c.color]
  // #9/#10: conteúdo é carregado sob demanda; parse memoizado (evita reparse por tecla).
  const loadingContent = !doc.content
  const parsed = useMemo(() => mdToHtml(doc.content), [doc.content])

  return (
    <>
      <div
        ref={(el) => {
          store.scrollElRef.current = el
        }}
        style={{ flex: 1, minWidth: 0, overflowY: 'auto', position: 'relative' }}
      >
        <div style={{ maxWidth: '840px', margin: '0 auto', padding: '34px 48px 90px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '14px' }}>
            <span style={catChipStyle(cc, true)}>
              <Icon name={c.icon} size={14} />
              {c.label}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 'none' }}>
              <button
                onClick={() => store.togglePin(doc.id)}
                title="Fixar"
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '9px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid ' + (doc.pinned ? 'rgba(var(--primary-rgb),0.5)' : 'var(--border-light)'),
                  background: doc.pinned ? 'var(--primary-subtle)' : 'transparent',
                  color: doc.pinned ? 'var(--primary)' : 'var(--text-secondary)',
                }}
              >
                <Icon name="push_pin" size={18} />
              </button>
              <Hoverable as="button" onClick={() => store.openEditDoc(doc.id)} title="Editar" hoverStyle={ghostHover} style={ghostAction}>
                <Icon name="edit" size={18} />
              </Hoverable>
              <Hoverable as="button" onClick={() => store.copyDoc(doc)} title="Copiar markdown" hoverStyle={ghostHover} style={ghostAction}>
                <Icon name={store.copiedId === doc.id ? 'check' : 'content_copy'} size={18} />
              </Hoverable>
              <Hoverable as="button" onClick={() => store.downloadDoc(doc)} title="Baixar .md" hoverStyle={ghostHover} style={ghostAction}>
                <Icon name="download" size={18} />
              </Hoverable>
              <Hoverable as="button" onClick={() => store.deleteDoc(doc.id)} title="Excluir" hoverStyle={dangerHover} style={ghostAction}>
                <Icon name="delete" size={18} />
              </Hoverable>
            </div>
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-primary)',
              fontWeight: 700,
              fontSize: '28px',
              letterSpacing: '-0.02em',
              color: 'var(--text)',
              margin: '0 0 8px',
              lineHeight: 1.25,
            }}
          >
            {doc.title}
          </h1>
          <p style={{ fontFamily: 'var(--font-secondary)', fontSize: '15px', color: 'var(--text-secondary)', margin: '0 0 12px', lineHeight: 1.55 }}>
            {doc.description}
          </p>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              flexWrap: 'wrap',
              fontFamily: 'var(--font-secondary)',
              fontSize: '12px',
              color: 'var(--text-muted)',
              marginBottom: '8px',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <Icon name="update" size={15} />
              Atualizado em {formatDate(doc.updatedAt)}
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <Icon name="schedule" size={15} />
              {readingTime(doc.content)}
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              {doc.tags.map((t) => (
                <span
                  key={t}
                  onClick={() => {
                    store.setTag(t)
                    store.setCat('all')
                  }}
                  style={{
                    cursor: 'pointer',
                    fontFamily: 'var(--font-secondary)',
                    fontSize: '11px',
                    color: 'var(--text-secondary)',
                    background: 'var(--surface-light)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '6px',
                    padding: '2px 8px',
                  }}
                >
                  {t}
                </span>
              ))}
            </span>
          </div>
          <hr style={{ border: 'none', borderTop: '1px solid var(--border-light)', margin: '18px 0 24px' }} />
          {loadingContent ? (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontFamily: 'var(--font-secondary)',
                fontSize: '13px',
                color: 'var(--text-muted)',
                padding: '20px 0',
              }}
            >
              <Icon name="hourglass_empty" size={17} />
              Carregando conteúdo…
            </div>
          ) : (
            <MarkdownArticle html={parsed.html} query={store.query} docId={doc.id} />
          )}
        </div>
      </div>

      <aside
        style={{
          width: '248px',
          flex: 'none',
          borderLeft: '1px solid var(--border-light)',
          overflowY: 'auto',
          padding: '30px 18px',
          background: 'var(--surface-alt)',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-primary)',
            fontWeight: 600,
            fontSize: '10.5px',
            letterSpacing: '0.09em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            marginBottom: '12px',
            paddingLeft: '10px',
          }}
        >
          Nesta página
        </div>
        {parsed.toc.length === 0 ? (
          <div style={{ fontFamily: 'var(--font-secondary)', fontSize: '12px', color: 'var(--text-muted)', paddingLeft: '10px' }}>
            Sem seções
          </div>
        ) : (
          parsed.toc.map((t) => (
            <Hoverable
              key={t.id}
              as="a"
              onClick={() => store.scrollToHeading(t.id)}
              hoverStyle={{ color: 'var(--primary)', background: 'var(--surface-light)', borderLeftColor: 'var(--primary)' }}
              style={{
                display: 'block',
                padding: '5px 10px',
                paddingLeft: t.level === 3 ? '22px' : '10px',
                borderLeft: '2px solid transparent',
                borderRadius: '0 8px 8px 0',
                fontFamily: 'var(--font-secondary)',
                fontSize: t.level === 3 ? '12px' : '12.5px',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                textDecoration: 'none',
                lineHeight: 1.4,
                marginBottom: '1px',
                transition: 'color 200ms, background 200ms, border-color 200ms',
              }}
            >
              {t.text}
            </Hoverable>
          ))
        )}
      </aside>
    </>
  )
}

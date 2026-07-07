// Router mínimo baseado em hash (sem dependência) — Fase 3 (#6).
// Formato das rotas:
//   #/projects
//   #/board
//   #/p/<projectId>[/s/<subId>][/d/<docId>]

export type Route =
  | { view: 'projects' }
  | { view: 'board' }
  | { view: 'library'; projectId: string; subId: string | null; docId: string | null }

export function parseHash(hash: string): Route {
  const raw = (hash || '').replace(/^#\/?/, '')
  const seg = raw.split('/').filter(Boolean).map(decodeURIComponent)
  if (seg[0] === 'board') return { view: 'board' }
  if (seg[0] === 'p' && seg[1]) {
    const projectId = seg[1]
    let subId: string | null = null
    let docId: string | null = null
    let i = 2
    while (i < seg.length) {
      if (seg[i] === 's' && seg[i + 1]) {
        subId = seg[i + 1]
        i += 2
      } else if (seg[i] === 'd' && seg[i + 1]) {
        docId = seg[i + 1]
        i += 2
      } else {
        i += 1
      }
    }
    return { view: 'library', projectId, subId, docId }
  }
  return { view: 'projects' }
}

export function buildHash(r: Route): string {
  if (r.view === 'board') return '#/board'
  if (r.view === 'library') {
    let s = '#/p/' + encodeURIComponent(r.projectId)
    if (r.subId) s += '/s/' + encodeURIComponent(r.subId)
    if (r.docId) s += '/d/' + encodeURIComponent(r.docId)
    return s
  }
  return '#/projects'
}

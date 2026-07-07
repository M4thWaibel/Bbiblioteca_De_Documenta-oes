// Renderizador de Markdown minimalista — portado 1:1 do design original.
// Suporta títulos (com TOC), listas, blocos de código, citações, tabelas,
// separadores, negrito, código inline e links.

export interface TocEntry {
  id: string
  level: number
  text: string
}

function esc(s: string): string {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function slug(s: string): string {
  return (
    String(s)
      .toLowerCase()
      .normalize('NFD')
      .replace(new RegExp('[\\u0300-\\u036f]', 'g'), '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'sec'
  )
}

// Permite apenas esquemas seguros (http/https/mailto) e URLs relativas/âncora,
// bloqueando vetores como javascript:, data:, vbscript: — inclusive ofuscados
// com espaços/controle (ex.: "java\tscript:"). Escapa aspas para não quebrar o
// atributo href.
function safeUrl(url: string): string {
  const raw = String(url).trim()
  const probe = raw.replace(/[\x00-\x20]/g, '').toLowerCase()
  const scheme = probe.match(/^([a-z][a-z0-9+.-]*):/)
  if (scheme && !['http', 'https', 'mailto'].includes(scheme[1])) return '#'
  return raw.replace(/"/g, '%22')
}

function inline(s: string): string {
  let t = esc(s)
  t = t.replace(/`([^`]+)`/g, (_m, c) => '<code>' + c + '</code>')
  t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  t = t.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (_m, text, href) =>
      '<a href="' + safeUrl(href) + '" target="_blank" rel="noopener">' + text + '</a>',
  )
  return t
}

function renderList(buf: string[]): string {
  const type = /^\s*\d+\./.test(buf[0].trim()) ? 'ol' : 'ul'
  const items: string[] = []
  buf.forEach((l) => {
    const m = l.match(/^\s*([-*+]|\d+\.)\s+(.*)$/)
    if (m) items.push(m[2])
    else if (items.length) items[items.length - 1] += ' ' + l.trim()
  })
  return '<' + type + '>' + items.map((t) => '<li>' + inline(t) + '</li>').join('') + '</' + type + '>'
}

export function mdToHtml(md: string): { html: string; toc: TocEntry[] } {
  const lines = String(md).replace(/\r\n?/g, '\n').split('\n')
  let html = ''
  let i = 0
  const toc: TocEntry[] = []
  const used: Record<string, number> = {}
  while (i < lines.length) {
    const line = lines[i]
    if (/^```/.test(line)) {
      i++
      const buf: string[] = []
      while (i < lines.length && !/^```/.test(lines[i])) {
        buf.push(lines[i])
        i++
      }
      i++
      html += '<pre><code>' + esc(buf.join('\n')) + '</code></pre>'
      continue
    }
    const h = line.match(/^(#{1,6})\s+(.*)$/)
    if (h) {
      const lvl = h[1].length
      const text = h[2].trim()
      let id = slug(text)
      if (used[id]) {
        id = id + '-' + ++used[id]
      } else used[id] = 1
      if (lvl >= 1 && lvl <= 3) toc.push({ id, level: lvl, text })
      html += '<h' + lvl + ' id="' + id + '">' + inline(text) + '</h' + lvl + '>'
      i++
      continue
    }
    if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      html += '<hr>'
      i++
      continue
    }
    if (/^>\s?/.test(line)) {
      const buf: string[] = []
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        buf.push(lines[i].replace(/^>\s?/, ''))
        i++
      }
      html += '<blockquote><p>' + inline(buf.join(' ')) + '</p></blockquote>'
      continue
    }
    if (
      /^\|.*\|/.test(line) &&
      i + 1 < lines.length &&
      /^\|[\s:\-|]+\|\s*$/.test(lines[i + 1].trim())
    ) {
      const header = line
        .trim()
        .replace(/^\||\|$/g, '')
        .split('|')
        .map((c) => c.trim())
      i += 2
      const rows: string[][] = []
      while (i < lines.length && /^\|.*\|/.test(lines[i])) {
        rows.push(
          lines[i]
            .trim()
            .replace(/^\||\|$/g, '')
            .split('|')
            .map((c) => c.trim()),
        )
        i++
      }
      html +=
        '<table><thead><tr>' +
        header.map((c) => '<th>' + inline(c) + '</th>').join('') +
        '</tr></thead><tbody>' +
        rows
          .map((r) => '<tr>' + r.map((c) => '<td>' + inline(c) + '</td>').join('') + '</tr>')
          .join('') +
        '</tbody></table>'
      continue
    }
    if (/^\s*([-*+]|\d+\.)\s+/.test(line)) {
      const buf: string[] = []
      while (
        i < lines.length &&
        (/^\s*([-*+]|\d+\.)\s+/.test(lines[i]) || (buf.length && /^\s+\S/.test(lines[i])))
      ) {
        buf.push(lines[i])
        i++
      }
      html += renderList(buf)
      continue
    }
    if (/^\s*$/.test(line)) {
      i++
      continue
    }
    const buf = [line]
    i++
    while (
      i < lines.length &&
      !/^\s*$/.test(lines[i]) &&
      !/^(#{1,6})\s/.test(lines[i]) &&
      !/^```/.test(lines[i]) &&
      !/^\s*([-*+]|\d+\.)\s+/.test(lines[i]) &&
      !/^>\s?/.test(lines[i]) &&
      !/^\|.*\|/.test(lines[i])
    ) {
      buf.push(lines[i])
      i++
    }
    html += '<p>' + inline(buf.join(' ')) + '</p>'
  }
  return { html, toc }
}

// Realça as ocorrências da busca dentro do HTML já renderizado (aplicado via ref).
export function highlight(node: HTMLElement, query: string): void {
  const q = (query || '').trim()
  if (!node || q.length < 2) return
  const rx = new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi')
  const skip: Record<string, number> = { SCRIPT: 1, STYLE: 1, MARK: 1, CODE: 1, PRE: 1 }
  const walk = (el: Node) => {
    Array.from(el.childNodes).forEach((n) => {
      if (n.nodeType === 3) {
        const txt = n.nodeValue || ''
        rx.lastIndex = 0
        if (!rx.test(txt)) return
        rx.lastIndex = 0
        const frag = document.createDocumentFragment()
        let last = 0
        let m: RegExpExecArray | null
        while ((m = rx.exec(txt))) {
          frag.appendChild(document.createTextNode(txt.slice(last, m.index)))
          const mk = document.createElement('mark')
          mk.textContent = m[0]
          frag.appendChild(mk)
          last = m.index + m[0].length
        }
        frag.appendChild(document.createTextNode(txt.slice(last)))
        n.parentNode?.replaceChild(frag, n)
      } else if (n.nodeType === 1 && !skip[(n as HTMLElement).tagName]) {
        walk(n)
      }
    })
  }
  walk(node)
}

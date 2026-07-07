import { describe, it, expect } from 'vitest'
import { mdToHtml, slug } from './markdown'

describe('slug', () => {
  it('normaliza acentos, caixa e espaços', () => {
    expect(slug('Introdução Geral')).toBe('introducao-geral')
  })
  it('usa fallback quando não sobra nada', () => {
    expect(slug('!!!')).toBe('sec')
  })
})

describe('mdToHtml — títulos e TOC', () => {
  it('coleta h1-h3 no TOC com ids únicos', () => {
    const { html, toc } = mdToHtml('# A\n\n## A\n\n### B')
    expect(toc.map((t) => t.id)).toEqual(['a', 'a-2', 'b'])
    expect(html).toContain('<h1 id="a">A</h1>')
  })
})

describe('mdToHtml — inline', () => {
  it('renderiza negrito, itálico e strikethrough', () => {
    const { html } = mdToHtml('**b** *i* ~~s~~')
    expect(html).toContain('<strong>b</strong>')
    expect(html).toContain('<em>i</em>')
    expect(html).toContain('<del>s</del>')
  })

  it('sanitiza links com esquema perigoso (#15)', () => {
    const { html } = mdToHtml('[x](javascript:alert(1))')
    expect(html).toContain('href="#"')
    expect(html).not.toContain('javascript:')
  })

  it('mantém links http/https', () => {
    const { html } = mdToHtml('[site](https://exemplo.com)')
    expect(html).toContain('href="https://exemplo.com"')
  })

  it('renderiza imagem com src sanitizado (#13)', () => {
    const { html } = mdToHtml('![alt](https://exemplo.com/x.png)')
    expect(html).toContain('<img src="https://exemplo.com/x.png"')
    expect(html).toContain('alt="alt"')
  })

  it('bloqueia imagem com src perigoso', () => {
    const { html } = mdToHtml('![x](javascript:alert(1))')
    expect(html).not.toContain('javascript:')
  })

  it('escapa HTML bruto', () => {
    const { html } = mdToHtml('<script>alert(1)</script>')
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })
})

describe('mdToHtml — listas (#13)', () => {
  it('lista não ordenada simples', () => {
    expect(mdToHtml('- a\n- b').html).toBe('<ul><li>a</li><li>b</li></ul>')
  })

  it('lista aninhada por indentação', () => {
    expect(mdToHtml('- a\n  - a1\n- b').html).toBe(
      '<ul><li>a<ul><li>a1</li></ul></li><li>b</li></ul>',
    )
  })

  it('checkbox de tarefa marcada e desmarcada', () => {
    const { html } = mdToHtml('- [x] feito\n- [ ] pendente')
    expect(html).toContain('<input type="checkbox" disabled checked>')
    expect(html).toContain('<input type="checkbox" disabled>')
  })
})

describe('mdToHtml — blocos', () => {
  it('bloco de código escapa o conteúdo', () => {
    expect(mdToHtml('```\n<b>\n```').html).toContain('<pre><code>&lt;b&gt;</code></pre>')
  })

  it('renderiza tabela', () => {
    const { html } = mdToHtml('| a | b |\n| - | - |\n| 1 | 2 |')
    expect(html).toContain('<table>')
    expect(html).toContain('<th>a</th>')
    expect(html).toContain('<td>1</td>')
  })
})

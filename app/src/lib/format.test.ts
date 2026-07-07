import { describe, it, expect } from 'vitest'
import { prettyName, initials, readingTime, matches } from './format'

describe('prettyName', () => {
  it('deriva um nome legível do e-mail', () => {
    expect(prettyName('joao.silva@exemplo.com')).toBe('Joao Silva')
  })
})

describe('initials', () => {
  it('usa as duas primeiras iniciais', () => {
    expect(initials('João Pedro Silva')).toBe('JP')
  })
  it('faz fallback para US quando vazio', () => {
    expect(initials('')).toBe('US')
  })
})

describe('readingTime', () => {
  it('garante no mínimo 1 min', () => {
    expect(readingTime('uma frase bem curta')).toBe('1 min de leitura')
  })
})

describe('matches', () => {
  it('conta as ocorrências', () => {
    expect(matches('a b a b a', 'a')).toBe(3)
  })
  it('retorna 0 sem consulta', () => {
    expect(matches('abc', '')).toBe(0)
  })
})

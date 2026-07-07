import type { Priority } from './types'

export interface Category {
  id: string
  label: string
  icon: string
  color: string // hex — cor própria (Update 2.0 · #6b)
  position: number
}

// Categorias padrão — usadas como seed do banco e como fallback caso a tabela
// ainda não tenha carregado. As categorias reais vêm de store.categories.
export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'dados', label: 'Dados', icon: 'dataset', color: '#64B5F6', position: 1000 },
  { id: 'rmr', label: 'Reuniões (RMR)', icon: 'event_note', color: '#FF7A7E', position: 2000 },
  { id: 'selo', label: 'Selo EAP', icon: 'verified', color: '#81C784', position: 3000 },
  { id: 'powerbi', label: 'Power BI', icon: 'insert_chart', color: '#A78BFA', position: 4000 },
  { id: 'pesquisas', label: 'Pesquisas', icon: 'poll', color: '#4DD0E1', position: 5000 },
  { id: 'indicadores', label: 'Indicadores', icon: 'trending_up', color: '#81C784', position: 6000 },
  { id: 'organograma', label: 'Organograma', icon: 'account_tree', color: '#64B5F6', position: 7000 },
  { id: 'geral', label: 'Geral', icon: 'description', color: '#FF7A7E', position: 8000 },
]

// Deriva as cores do chip a partir de um hex (fg = hex, bg = hex com alpha baixo).
export function catChip(hex: string): { bg: string; fg: string } {
  const h = /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : '#a0a0a0'
  return { bg: h + '22', fg: h }
}

export const projColors = ['#E5484D', '#2A6FDB', '#1F8A5B', '#7C3AED', '#E6A800', '#17A2B8']

export interface Status {
  id: string
  label: string
  color: string
  position: number
}

// Status padrão — seed do banco e fallback. Os reais vêm de store.statuses.
export const DEFAULT_STATUSES: Status[] = [
  { id: 'todo', label: 'A fazer', color: '#A0A0A0', position: 1000 },
  { id: 'doing', label: 'Em andamento', color: '#E5484D', position: 2000 },
  { id: 'review', label: 'Em revisão', color: '#E6A800', position: 3000 },
  { id: 'done', label: 'Concluído', color: '#1F8A5B', position: 4000 },
]

export function statusFrom(id: string, list: Status[]): Status {
  return list.find((s) => s.id === id) || list[0] || DEFAULT_STATUSES[0]
}

export const priorityMeta: Record<Priority, { label: string; color: string }> = {
  low: { label: 'Baixa', color: '#4DD0E1' },
  med: { label: 'Média', color: '#E6A800' },
  high: { label: 'Alta', color: '#F87171' },
}

export const priorityOptions: { id: Priority; label: string }[] = [
  { id: 'low', label: 'Baixa' },
  { id: 'med', label: 'Média' },
  { id: 'high', label: 'Alta' },
]

// Resolve uma categoria por id numa lista (fallback para 'geral' ou último).
export function catFrom(id: string, list: Category[]): Category {
  return (
    list.find((c) => c.id === id) ||
    list.find((c) => c.id === 'geral') ||
    DEFAULT_CATEGORIES[DEFAULT_CATEGORIES.length - 1]
  )
}

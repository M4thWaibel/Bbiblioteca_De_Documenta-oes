import type { Priority, TaskStatus } from './types'

export interface Category {
  id: string
  label: string
  icon: string
  color: keyof typeof catColors
}

export const cats: Category[] = [
  { id: 'dados', label: 'Dados', icon: 'dataset', color: 'blue' },
  { id: 'rmr', label: 'Reuniões (RMR)', icon: 'event_note', color: 'gold' },
  { id: 'selo', label: 'Selo EAP', icon: 'verified', color: 'green' },
  { id: 'powerbi', label: 'Power BI', icon: 'insert_chart', color: 'purple' },
  { id: 'pesquisas', label: 'Pesquisas', icon: 'poll', color: 'teal' },
  { id: 'indicadores', label: 'Indicadores', icon: 'trending_up', color: 'green' },
  { id: 'organograma', label: 'Organograma', icon: 'account_tree', color: 'blue' },
  { id: 'geral', label: 'Geral', icon: 'description', color: 'gold' },
]

export const catColors = {
  gold: { bg: 'rgba(var(--primary-rgb),0.14)', fg: '#FF7A7E' },
  blue: { bg: 'rgba(33,150,243,0.12)', fg: '#64B5F6' },
  green: { bg: 'rgba(76,175,80,0.12)', fg: '#81C784' },
  purple: { bg: 'rgba(124,58,237,0.14)', fg: '#A78BFA' },
  teal: { bg: 'rgba(23,162,184,0.14)', fg: '#4DD0E1' },
} as const

export const projColors = ['#E5484D', '#2A6FDB', '#1F8A5B', '#7C3AED', '#E6A800', '#17A2B8']

export interface ColumnMeta {
  status: TaskStatus
  label: string
  color: string
}

export const columnsMeta: ColumnMeta[] = [
  { status: 'todo', label: 'A fazer', color: '#A0A0A0' },
  { status: 'doing', label: 'Em andamento', color: '#E5484D' },
  { status: 'review', label: 'Em revisão', color: '#E6A800' },
  { status: 'done', label: 'Concluído', color: '#1F8A5B' },
]

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

export function cat(id: string): Category {
  return cats.find((c) => c.id === id) || cats[cats.length - 1]
}

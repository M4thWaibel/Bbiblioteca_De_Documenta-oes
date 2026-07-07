// Accents de interface (Update 2.0 · #6c). Cada accent sobrescreve o conjunto
// de tokens --primary*. As tintas rgba(var(--primary-rgb), α) seguem o accent
// automaticamente. O accent padrão (vermelho) usa os valores do CSS (que já são
// cientes de tema claro/escuro); os demais aplicam um tom único nos dois temas.

export interface Accent {
  id: string
  label: string
  swatch: string
  vars: Record<string, string>
}

function mk(rgb: string, base: string, hover: string, light: string, dark: string): Record<string, string> {
  return {
    '--primary-rgb': rgb,
    '--primary': base,
    '--primary-hover': hover,
    '--primary-light': light,
    '--primary-dark': dark,
    '--gradient-primary': `linear-gradient(135deg, ${base} 0%, ${dark} 100%)`,
    '--gradient-primary-hover': `linear-gradient(135deg, ${light} 0%, ${base} 100%)`,
  }
}

export const accents: Accent[] = [
  { id: 'vermelho', label: 'Vermelho', swatch: '#e5484d', vars: {} },
  { id: 'azul', label: 'Azul', swatch: '#2a6fdb', vars: mk('42, 111, 219', '#2a6fdb', '#3f7fe0', '#5b93e8', '#1b52a8') },
  { id: 'verde', label: 'Verde', swatch: '#1f8a5b', vars: mk('31, 138, 91', '#1f8a5b', '#268f62', '#37a877', '#14603f') },
  { id: 'roxo', label: 'Roxo', swatch: '#7c3aed', vars: mk('124, 58, 237', '#7c3aed', '#8b4ff0', '#9b6bf0', '#5b21b6') },
  { id: 'ambar', label: 'Âmbar', swatch: '#e6a800', vars: mk('230, 168, 0', '#e6a800', '#f0b41a', '#f0bd33', '#b38400') },
]

export const ACCENT_KEY = 'biblioteca_accent'

export function accentVars(id: string): Record<string, string> {
  return accents.find((a) => a.id === id)?.vars || {}
}

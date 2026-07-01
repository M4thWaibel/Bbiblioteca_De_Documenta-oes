import { useState, type CSSProperties, type ElementType, type ReactNode } from 'react'

interface HoverableProps {
  as?: ElementType
  style?: CSSProperties
  hoverStyle?: CSSProperties
  children?: ReactNode
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

/**
 * Reproduz o `style-hover` do runtime DC: aplica `hoverStyle` sobre `style`
 * enquanto o ponteiro está sobre o elemento. Aceita qualquer tag via `as`.
 */
export function Hoverable({
  as: Tag = 'div',
  style,
  hoverStyle,
  children,
  onMouseEnter,
  onMouseLeave,
  ...rest
}: HoverableProps) {
  const [hovered, setHovered] = useState(false)
  return (
    <Tag
      style={hovered && hoverStyle ? { ...style, ...hoverStyle } : style}
      onMouseEnter={(e: unknown) => {
        setHovered(true)
        onMouseEnter?.(e)
      }}
      onMouseLeave={(e: unknown) => {
        setHovered(false)
        onMouseLeave?.(e)
      }}
      {...rest}
    >
      {children}
    </Tag>
  )
}
